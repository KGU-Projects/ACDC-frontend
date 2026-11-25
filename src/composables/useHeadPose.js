import { ref } from 'vue'
import { acquireLandmarker, releaseLandmarker } from './faceLandmarker'
import { HeadPoseAnalyzer, SAMPLE_INTERVAL_MS, pitchDegrees } from './headPose'

/**
 * 면담 중 약 10Hz로 머리 pitch를 읽어 끄덕임·앞으로 기울임을 계산한다(값은 제출 때 한 번 보낸다).
 * 표정 전송(useFaceEmotion)이 실패해 unavailable이 되어도 이 측정은 따로 계속된다.
 * 측정 실패는 면담을 막지 않으며, 못 잰 값은 getFeatures()에서 빠진다.
 */
export function useHeadPose() {
  const unavailable = ref(false)

  let landmarker = null
  let videoEl = null
  let timer = null
  let analyzer = new HeadPoseAnalyzer()

  const tick = () => {
    if (!landmarker || !videoEl || !videoEl.videoWidth || videoEl.readyState < 2) return
    try {
      const result = landmarker.detectForVideo(videoEl, performance.now())
      const matrix = result.facialTransformationMatrixes?.[0]
      if (!matrix) return // 얼굴이 없으면 유효 샘플에 넣지 않는다
      analyzer.addSample(performance.now(), pitchDegrees(matrix.data))
    } catch (error) {
      console.warn('머리 자세 측정 실패:', error)
    }
  }

  const start = async (video) => {
    stop()
    videoEl = video
    unavailable.value = false
    try {
      landmarker = landmarker || (await acquireLandmarker())
    } catch (error) {
      console.error('머리 자세 측정 초기화 실패:', error)
      unavailable.value = true
      return
    }
    timer = setInterval(tick, SAMPLE_INTERVAL_MS)
  }

  const stop = () => {
    if (timer) clearInterval(timer)
    timer = null
  }

  /** 제출 body의 frontendFeatures. 30초 미만이면 {}. */
  const getFeatures = () => analyzer.result()

  const dispose = () => {
    stop()
    if (landmarker) releaseLandmarker()
    landmarker = null
  }

  return { unavailable, start, stop, getFeatures, dispose }
}
