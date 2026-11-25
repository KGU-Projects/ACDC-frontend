import { ref } from 'vue'

// 지원하면 webm(vp9 → vp8 + opus), 아니면 mp4 순으로 고른다.
const CANDIDATES = [
  { mime: 'video/webm;codecs=vp9,opus', ext: 'webm' },
  { mime: 'video/webm;codecs=vp8,opus', ext: 'webm' },
  { mime: 'video/webm', ext: 'webm' },
  { mime: 'video/mp4', ext: 'mp4' }
]
const VIDEO_BPS = 1_000_000
const AUDIO_BPS = 64_000
const TIMESLICE_MS = 5000

const pickFormat = () => {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return null
  return CANDIDATES.find((c) => MediaRecorder.isTypeSupported(c.mime)) || null
}

/**
 * 면담 스트림을 MediaRecorder로 녹화한다. 녹화는 부가 기능이라 지원하지 않거나 실패해도 면담·제출을 막지 않는다.
 * - start(stream): 이미 녹화 중이면 아무것도 하지 않는다(같은 페이지에서 enterCall이 다시 불려도 중복 녹화가 없다).
 * - stop(): 녹화를 끝내고 { blob, filename }을 돌려준다(없으면 null). 여러 번 불러도 같은 결과다.
 * - discard(): 업로드를 끝냈거나 포기한 뒤 메모리를 비운다.
 */
export function useInterviewRecorder() {
  const recording = ref(false)
  const supported = Boolean(pickFormat())

  let recorder = null
  let format = null
  let chunks = []
  let finished = null
  let stopping = null

  const reset = () => {
    recorder = null
    chunks = []
    finished = null
    stopping = null
    recording.value = false
  }

  const start = (stream) => {
    if (recorder && recorder.state === 'recording') return true
    if (finished || stopping) return false // 제출 중이거나 확정된 녹화는 다시 시작하지 않는다
    const picked = pickFormat()
    if (!picked || !stream) return false
    reset() // 트랙이 끊겨 멈춘 이전 녹화는 이어 붙일 수 없어 버린다(앞부분 손실)
    try {
      format = picked
      const current = new MediaRecorder(stream, {
        mimeType: picked.mime,
        videoBitsPerSecond: VIDEO_BPS,
        audioBitsPerSecond: AUDIO_BPS
      })
      current.ondataavailable = (event) => {
        if (event.data?.size) chunks.push(event.data)
      }
      current.onerror = () => {
        if (recorder === current) recording.value = false
      }
      recorder = current
      current.start(TIMESLICE_MS)
      recording.value = true
      return true
    } catch {
      reset()
      return false
    }
  }

  const stop = () => {
    if (finished) return Promise.resolve(finished)
    if (stopping) return stopping
    const current = recorder
    if (!current) return Promise.resolve(null)
    const finalize = () => {
      recording.value = false
      const blob = chunks.length ? new Blob(chunks, { type: format.mime.split(';')[0] }) : null
      chunks = []
      finished = blob ? { blob, filename: `interview.${format.ext}` } : null
      return finished
    }
    stopping = new Promise((resolve) => {
      if (current.state === 'inactive') {
        resolve(finalize())
        return
      }
      current.onstop = () => resolve(finalize())
      try {
        current.stop()
      } catch {
        resolve(finalize())
      }
    })
    return stopping
  }

  const discard = () => {
    try {
      if (recorder && recorder.state !== 'inactive') recorder.stop()
    } catch {
      // 이미 멈춘 녹화기는 무시한다
    }
    reset()
  }

  return { recording, supported, start, stop, discard }
}
