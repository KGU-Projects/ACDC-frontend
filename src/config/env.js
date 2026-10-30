const getEnv = (key, fallback = '') => import.meta.env[key] || fallback

const trimTrailingSlash = (value) => value.replace(/\/+$/, '')

const requireEnv = (key) => {
  const value = getEnv(key)

  if (!value) {
    throw new Error(`${key} 환경변수가 설정되지 않았습니다.`)
  }

  return value
}

const toBoolean = (value) => String(value).toLowerCase() === 'true'

export const BACKEND_BASE_URL = trimTrailingSlash(requireEnv('VITE_BACKEND_BASE_URL'))
export const API_BASE_URL = trimTrailingSlash(getEnv('VITE_API_BASE_URL', BACKEND_BASE_URL))
export const WS_BASE_URL = trimTrailingSlash(
  getEnv('VITE_WS_BASE_URL', BACKEND_BASE_URL.replace(/^http/, 'ws'))
)
export const WS_INTERVIEW_PATH = getEnv('VITE_WS_INTERVIEW_PATH', '/api/ws-interview')
export const USE_SOCKJS_TRANSPORT = toBoolean(getEnv('VITE_USE_SOCKJS_TRANSPORT', 'true'))
export const MEDIAPIPE_WASM_URL = requireEnv('VITE_MEDIAPIPE_WASM_URL')
export const FACE_LANDMARKER_MODEL_URL = requireEnv('VITE_FACE_LANDMARKER_MODEL_URL')

export const apiUrl = (path) => {
  if (!API_BASE_URL || API_BASE_URL === '/') return path
  return new URL(path, `${API_BASE_URL}/`).toString()
}
export const webSocketUrl = (path) => new URL(path, `${WS_BASE_URL}/`).toString()
