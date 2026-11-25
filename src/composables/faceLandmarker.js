import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import { FACE_LANDMARKER_MODEL_URL, MEDIAPIPE_WASM_URL } from '../config/env'

// 표정 분석(useFaceEmotion)과 머리 자세 측정(useHeadPose)이 한 모델 인스턴스를 나눠 쓴다.
// 사용하는 쪽이 모두 release하면 닫는다. detectForVideo는 동기라 호출 순서가 곧 타임스탬프 순서다.
let instance = null
let loading = null
let users = 0

const create = async () => {
  const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL)
  const options = {
    baseOptions: { modelAssetPath: FACE_LANDMARKER_MODEL_URL, delegate: 'GPU' },
    runningMode: 'VIDEO',
    numFaces: 1,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: true
  }
  try {
    return await FaceLandmarker.createFromOptions(vision, options)
  } catch (gpuError) {
    console.warn('MediaPipe GPU 초기화 실패, CPU로 재시도합니다:', gpuError)
    return FaceLandmarker.createFromOptions(vision, {
      ...options,
      baseOptions: { ...options.baseOptions, delegate: 'CPU' }
    })
  }
}

/** 공유 landmarker를 얻는다. 호출할 때마다 release()를 한 번씩 짝지어 불러야 한다. */
export const acquireLandmarker = async () => {
  users += 1
  try {
    if (!instance) {
      if (!loading) loading = create()
      instance = await loading
    }
    return instance
  } catch (error) {
    users -= 1
    loading = null
    throw error
  }
}

export const releaseLandmarker = () => {
  users = Math.max(0, users - 1)
  if (users === 0 && instance) {
    instance.close?.()
    instance = null
    loading = null
  }
}
