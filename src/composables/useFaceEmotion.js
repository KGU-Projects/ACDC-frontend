import { onBeforeUnmount, ref } from 'vue'
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import { FACE_LANDMARKER_MODEL_URL, MEDIAPIPE_WASM_URL } from '../config/env'
import { sendEmotion } from '../api/acdc'

// interviewMirror의 얼굴 전처리와 같은 값(AI 서버 ONNX 모델 입력: 1x3x224x224, ImageNet 정규화)
const FACE_INPUT_SIZE = 224
const FACE_INPUT_SHAPE = [1, 3, FACE_INPUT_SIZE, FACE_INPUT_SIZE]
const FACE_MEAN = [0.485, 0.456, 0.406]
const FACE_STD = [0.229, 0.224, 0.225]
const FACE_BBOX_MARGIN = 0.25
const SEND_INTERVAL_MS = 3000
const MAX_CONSECUTIVE_FAILURES = 3

export const EMOTION_LABELS = {
  stable_confident: '안정·자신감',
  neutral: '보통',
  nervous_anxious: '긴장',
  no_face: '얼굴 미검출'
}

/**
 * 비디오 프레임에서 3초마다 얼굴을 잘라 정규화 텐서로 만들어 /emotions로 보낸다.
 * 표정 모델이 없거나 연속 실패하면 전송을 멈추고 unavailable만 true로 둔다(대화에는 영향 없음).
 */
export function useFaceEmotion(sessionId) {
  const label = ref('')
  const unavailable = ref(false)
  const loading = ref(false)

  let landmarker = null
  let videoEl = null
  let timer = null
  let busy = false
  let failures = 0
  let canvas = null

  const initLandmarker = async () => {
    if (landmarker) return landmarker
    const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL)
    const options = {
      baseOptions: { modelAssetPath: FACE_LANDMARKER_MODEL_URL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numFaces: 1,
      outputFaceBlendshapes: false
    }
    try {
      landmarker = await FaceLandmarker.createFromOptions(vision, options)
    } catch (gpuError) {
      console.warn('MediaPipe GPU 초기화 실패, CPU로 재시도합니다:', gpuError)
      landmarker = await FaceLandmarker.createFromOptions(vision, {
        ...options,
        baseOptions: { ...options.baseOptions, delegate: 'CPU' }
      })
    }
    return landmarker
  }

  const createFaceBoundingBox = (landmarks) => {
    const xs = landmarks.map((p) => p.x)
    const ys = landmarks.map((p) => p.y)
    const w = videoEl.videoWidth || 1
    const h = videoEl.videoHeight || 1
    const rawX1 = Math.min(...xs) * w
    const rawY1 = Math.min(...ys) * h
    const rawX2 = Math.max(...xs) * w
    const rawY2 = Math.max(...ys) * h
    const marginX = (rawX2 - rawX1) * FACE_BBOX_MARGIN
    const marginY = (rawY2 - rawY1) * FACE_BBOX_MARGIN
    return {
      x1: Math.max(0, Math.round(rawX1 - marginX)),
      y1: Math.max(0, Math.round(rawY1 - marginY)),
      x2: Math.min(w, Math.round(rawX2 + marginX)),
      y2: Math.min(h, Math.round(rawY2 + marginY))
    }
  }

  const preprocessFaceCrop = (bbox) => {
    if (bbox.x2 <= bbox.x1 || bbox.y2 <= bbox.y1) return null
    if (!canvas) {
      canvas = document.createElement('canvas')
      canvas.width = FACE_INPUT_SIZE
      canvas.height = FACE_INPUT_SIZE
    }
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null
    ctx.drawImage(videoEl, bbox.x1, bbox.y1, bbox.x2 - bbox.x1, bbox.y2 - bbox.y1, 0, 0, FACE_INPUT_SIZE, FACE_INPUT_SIZE)
    const { data } = ctx.getImageData(0, 0, FACE_INPUT_SIZE, FACE_INPUT_SIZE)
    const count = FACE_INPUT_SIZE * FACE_INPUT_SIZE
    const features = new Array(3 * count)
    for (let i = 0; i < count; i += 1) {
      const s = i * 4
      features[i] = Number(((data[s] / 255 - FACE_MEAN[0]) / FACE_STD[0]).toFixed(6))
      features[count + i] = Number(((data[s + 1] / 255 - FACE_MEAN[1]) / FACE_STD[1]).toFixed(6))
      features[count * 2 + i] = Number(((data[s + 2] / 255 - FACE_MEAN[2]) / FACE_STD[2]).toFixed(6))
    }
    return features
  }

  const buildPayload = () => {
    if (!landmarker || !videoEl || !videoEl.videoWidth || !videoEl.videoHeight) return null
    const result = landmarker.detectForVideo(videoEl, performance.now())
    const landmarks = result.faceLandmarks?.[0]
    const empty = { tensorShape: [...FACE_INPUT_SHAPE], features: [], faceDetected: false }
    if (!landmarks?.length) return empty
    const features = preprocessFaceCrop(createFaceBoundingBox(landmarks))
    return features ? { tensorShape: [...FACE_INPUT_SHAPE], features, faceDetected: true } : empty
  }

  const tick = async () => {
    if (busy || unavailable.value) return
    busy = true
    try {
      const payload = buildPayload()
      if (!payload) return
      const res = await sendEmotion(sessionId, payload)
      failures = 0
      label.value = res?.label || ''
    } catch (e) {
      failures += 1
      if (failures >= MAX_CONSECUTIVE_FAILURES) {
        unavailable.value = true
        stop()
      }
    } finally {
      busy = false
    }
  }

  const start = async (video) => {
    stop()
    videoEl = video
    unavailable.value = false
    failures = 0
    loading.value = true
    try {
      await initLandmarker()
    } catch (e) {
      console.error('MediaPipe Face Landmarker 초기화 실패:', e)
      unavailable.value = true
      return
    } finally {
      loading.value = false
    }
    timer = setInterval(tick, SEND_INTERVAL_MS)
  }

  const stop = () => {
    if (timer) clearInterval(timer)
    timer = null
  }

  const dispose = () => {
    stop()
    landmarker?.close?.()
    landmarker = null
  }

  onBeforeUnmount(dispose)

  return { label, unavailable, loading, start, stop, dispose }
}
