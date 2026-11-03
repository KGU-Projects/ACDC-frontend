const trimTrailingSlash = (value) => value.replace(/\/+$/, '')

const BACKEND = import.meta.env.VITE_BACKEND_BASE_URL

if (!BACKEND) {
  throw new Error('VITE_BACKEND_BASE_URL 환경변수가 설정되지 않았습니다.')
}

export const BACKEND_BASE_URL = trimTrailingSlash(BACKEND)
export const API_BASE_URL = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || BACKEND_BASE_URL)

// 표정 분석(MediaPipe)용 자산. 선택 값이며 기본값은 공개 CDN이다.
export const MEDIAPIPE_WASM_URL =
  import.meta.env.VITE_MEDIAPIPE_WASM_URL ||
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
export const FACE_LANDMARKER_MODEL_URL =
  import.meta.env.VITE_FACE_LANDMARKER_MODEL_URL ||
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task'

export const apiUrl = (path) => {
  if (!API_BASE_URL || API_BASE_URL === '/') return path
  return new URL(path, `${API_BASE_URL}/`).toString()
}
