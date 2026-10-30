/**
 * AudioWorkletProcessor — 1초 단위 음성 특징 집계
 *
 * 매 process() 호출(128 샘플)마다 블록 통계를 누적하고,
 * 누적 샘플 수가 sampleRate(≈1초)를 넘으면 창(window) 단위 결과를 postMessage로 전달한다.
 *
 * 출력 메시지 구조:
 * {
 *   rms: number,              // 창 평균 RMS (음량 에너지)
 *   zeroCrossingRate: number, // 창 평균 ZCR (고주파/노이즈 비율)
 *   isSpeaking: boolean,      // 발화 판정 (speechSamples > 50%)
 *   speechDurationMs: number, // 발화 구간 합산 (ms)
 *   silenceDurationMs: number,// 침묵 구간 합산 (ms)
 *   peakAmplitude: number,    // 창 내 최대 진폭
 * }
 */
class AudioFeatureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._bufRms = [];
    this._bufZcr = [];
    this._bufSpeechSamples = 0;
    this._bufTotalSamples = 0;
    this._peakAmplitude = 0;
    // rms 기반 VAD 임계값 — 주변 노이즈 수준에 따라 조정 가능
    this._speechThreshold = 0.002;
  }

  process(inputs) {
    const channel = inputs[0]?.[0];
    if (!channel || channel.length === 0) return true;

    const n = channel.length;
    let sumSq = 0;
    let zeroCrossings = 0;
    let prev = channel[0];

    for (let i = 0; i < n; i++) {
      const s = channel[i];
      sumSq += s * s;
      if (i > 0 && s >= 0 !== prev >= 0) zeroCrossings++;
      prev = s;
      const abs = Math.abs(s);
      if (abs > this._peakAmplitude) this._peakAmplitude = abs;
    }

    const blockRms = Math.sqrt(sumSq / n);
    const blockZcr = zeroCrossings / n;
    const blockSpeaking = blockRms > this._speechThreshold;

    this._bufRms.push(blockRms);
    this._bufZcr.push(blockZcr);
    if (blockSpeaking) this._bufSpeechSamples += n;
    this._bufTotalSamples += n;

    if (this._bufTotalSamples >= sampleRate) {
      const len = this._bufRms.length;
      const avgRms = this._bufRms.reduce((a, b) => a + b, 0) / len;
      const avgZcr = this._bufZcr.reduce((a, b) => a + b, 0) / len;
      const speechMs = Math.round((this._bufSpeechSamples / sampleRate) * 1000);
      const silenceMs = Math.round(((this._bufTotalSamples - this._bufSpeechSamples) / sampleRate) * 1000);
      const windowSpeaking = this._bufSpeechSamples > this._bufTotalSamples * 0.5;

      this.port.postMessage({
        rms: parseFloat(avgRms.toFixed(4)),
        zeroCrossingRate: parseFloat(avgZcr.toFixed(4)),
        isSpeaking: windowSpeaking,
        speechDurationMs: speechMs,
        silenceDurationMs: silenceMs,
        peakAmplitude: parseFloat(this._peakAmplitude.toFixed(4)),
      });

      this._bufRms = [];
      this._bufZcr = [];
      this._bufSpeechSamples = 0;
      this._bufTotalSamples = 0;
      this._peakAmplitude = 0;
    }

    return true;
  }
}

registerProcessor("audio-feature-processor", AudioFeatureProcessor);
