import { onBeforeUnmount, ref } from 'vue'
import { sendAudioFeatures } from '../api/acdc'

const FLUSH_INTERVAL_MS = 5000
const MAX_BUFFER = 300
const MAX_PER_REQUEST = 120

/**
 * 마이크 트랙에서 AudioWorklet이 만든 1초 창 특징(음량·발화/침묵 시간 등)을 모아
 * 5초마다 백엔드로 보낸다. 실패하면 버퍼를 유지하고 다음에 다시 보낸다(최대 300개).
 */
export function useAudioFeatures(sessionId) {
  const level = ref(0) // 0~1, 마이크 레벨 표시용
  const speaking = ref(false)
  const unavailable = ref(false)

  let audioContext = null
  let sourceNode = null
  let workletNode = null
  let timer = null
  let buffer = []
  let flushing = false

  const flush = async () => {
    if (flushing || !buffer.length) return
    flushing = true
    try {
      while (buffer.length) {
        const batch = buffer.slice(0, MAX_PER_REQUEST)
        await sendAudioFeatures(sessionId, batch)
        buffer = buffer.slice(batch.length)
      }
    } catch (e) {
      // 버퍼 유지, 다음 주기에 재시도
    } finally {
      flushing = false
    }
  }

  const start = async (stream) => {
    stop()
    unavailable.value = false
    const track = stream?.getAudioTracks?.()[0]
    if (!track || !window.AudioContext) {
      unavailable.value = true
      return
    }
    try {
      audioContext = new AudioContext()
      await audioContext.audioWorklet.addModule('/worklets/audio-processor.js')
      sourceNode = audioContext.createMediaStreamSource(new MediaStream([track]))
      workletNode = new AudioWorkletNode(audioContext, 'audio-feature-processor')
      workletNode.port.onmessage = (event) => {
        const m = event.data
        level.value = Math.min(1, (m.rms || 0) * 8)
        speaking.value = Boolean(m.isSpeaking)
        buffer.push({
          timestamp: Date.now(),
          rms: m.rms,
          zeroCrossingRate: m.zeroCrossingRate,
          speaking: Boolean(m.isSpeaking),
          speechDurationMs: m.speechDurationMs,
          silenceDurationMs: m.silenceDurationMs,
          peakAmplitude: m.peakAmplitude
        })
        if (buffer.length > MAX_BUFFER) buffer = buffer.slice(buffer.length - MAX_BUFFER)
      }
      sourceNode.connect(workletNode)
      timer = setInterval(flush, FLUSH_INTERVAL_MS)
    } catch (e) {
      console.error('음성 특징 수집 시작 실패:', e)
      unavailable.value = true
    }
  }

  const stop = () => {
    if (timer) clearInterval(timer)
    timer = null
    try {
      sourceNode?.disconnect()
      workletNode?.disconnect()
    } catch (e) {
      // ignore
    }
    sourceNode = null
    workletNode = null
    audioContext?.close?.().catch(() => {})
    audioContext = null
    level.value = 0
    speaking.value = false
  }

  onBeforeUnmount(stop)

  return { level, speaking, unavailable, start, stop, flush }
}
