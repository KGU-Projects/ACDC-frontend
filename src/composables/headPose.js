// 머리 자세(pitch)에서 끄덕임·앞으로 기울임을 계산한다. 화면과 무관한 순수 계산이라 따로 둔다.
//
// ※ 아래 두 지표의 정의와 상수는 팀에서 정규화 범위가 확정되지 않은 "잠정값"이다.
//   확정되면 이 파일의 상수와 README의 설명을 함께 고친다.

export const SAMPLE_INTERVAL_MS = 100 // 약 10Hz
export const MIN_VALID_SECONDS = 30 // 유효 샘플이 이보다 짧으면 두 값 모두 보내지 않는다(0으로 채우지 않음)
export const BASELINE_SECONDS = 30 // 첫 30초의 pitch 중앙값을 "바른 자세" 기준으로 쓴다
export const NOD_MIN_AMPLITUDE_DEG = 5 // 내려갔다 올라오는 진폭 하한
export const NOD_MIN_SECONDS = 0.2
export const NOD_MAX_SECONDS = 1.5
export const NOD_PER_MINUTE_FOR_MAX = 20 // 분당 20회 이상이면 1.0
const MAX_GAP_SECONDS = 1 // 이보다 오래 샘플이 끊기면 진행 중이던 동작은 버린다

const RAD_TO_DEG = 180 / Math.PI

/**
 * MediaPipe facialTransformationMatrixes[0].data(4x4, column-major)에서 pitch(도)를 구한다.
 * R[row][col] = data[col * 4 + row]. x축 회전 = atan2(-R[1][2], R[2][2]).
 * MediaPipe 얼굴 좌표는 y가 위, 얼굴 앞면이 +z(카메라 쪽)이므로 x축 양의 회전은 고개를 숙이는 방향이다.
 * 즉 값이 클수록 앞으로 숙인 것이다.
 */
export const pitchDegrees = (data) => {
  if (!data || data.length < 16) return null
  const r12 = data[2 * 4 + 1] // R[1][2]
  const r22 = data[2 * 4 + 2] // R[2][2]
  const pitch = Math.atan2(-r12, r22) * RAD_TO_DEG
  return Number.isFinite(pitch) ? pitch : null
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = sorted.length >> 1
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/** 샘플(시각 ms, pitch 도)을 차례로 받아 nod_frequency, forward_lean_angle을 계산한다. */
export class HeadPoseAnalyzer {
  constructor() {
    this.validSeconds = 0
    this.lastT = null
    this.baselinePitches = []
    this.baseline = null
    this.leanSum = 0
    this.leanCount = 0
    this.nods = 0
    this.resetNod()
  }

  resetNod() {
    this.nodState = 'idle' // idle: 고개가 올라와 있는 쪽 기준점 추적, down: 내려간 뒤 올라오길 기다림
    this.startVal = null
    this.startT = null
    this.peak = null
  }

  addSample(tMs, pitch) {
    if (pitch == null || !Number.isFinite(pitch)) return
    const t = tMs / 1000
    if (this.lastT != null) {
      const dt = t - this.lastT
      if (dt <= 0) return
      if (dt > MAX_GAP_SECONDS) this.resetNod()
      else this.validSeconds += dt
    }
    this.lastT = t

    // 기준 자세: 유효 시간 첫 30초의 중앙값. 그 이후 샘플부터 기울임을 쌓는다.
    if (this.baseline == null) {
      this.baselinePitches.push(pitch)
      if (this.validSeconds >= BASELINE_SECONDS) this.baseline = median(this.baselinePitches)
    } else {
      this.leanSum += Math.max(0, pitch - this.baseline) // 뒤로 젖힌 값은 0으로 본다
      this.leanCount += 1
    }

    this.trackNod(t, pitch)
  }

  trackNod(t, pitch) {
    if (this.startVal == null) {
      this.startVal = pitch
      this.startT = t
      return
    }
    if (this.nodState === 'idle') {
      if (pitch <= this.startVal) {
        this.startVal = pitch
        this.startT = t
      } else if (pitch - this.startVal >= NOD_MIN_AMPLITUDE_DEG) {
        this.nodState = 'down'
        this.peak = pitch
      }
      return
    }
    // down
    if (t - this.startT > NOD_MAX_SECONDS) {
      this.resetNod() // 너무 느린 움직임은 끄덕임이 아니다
      this.startVal = pitch
      this.startT = t
      return
    }
    if (pitch > this.peak) this.peak = pitch
    if (this.peak - pitch >= NOD_MIN_AMPLITUDE_DEG) {
      const duration = t - this.startT
      if (duration >= NOD_MIN_SECONDS && duration <= NOD_MAX_SECONDS) this.nods += 1
      this.resetNod()
      this.startVal = pitch
      this.startT = t
    }
  }

  /** 측정한 키만 담아 돌려준다. 유효 샘플이 30초 미만이면 빈 객체다. */
  result() {
    if (this.validSeconds < MIN_VALID_SECONDS) return {}
    const out = {}
    const perMinute = this.nods / (this.validSeconds / 60)
    out.nod_frequency = Number(Math.min(1, perMinute / NOD_PER_MINUTE_FOR_MAX).toFixed(3))
    if (this.leanCount > 0) out.forward_lean_angle = Number((this.leanSum / this.leanCount).toFixed(2))
    return out
  }
}
