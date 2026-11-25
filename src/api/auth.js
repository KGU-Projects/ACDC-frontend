import { BACKEND_BASE_URL } from '../config/env'
import {
  apiGet,
  apiPost,
  clearAuthSession,
  getAccessToken,
  getStoredUser,
  saveAuthSession
} from './client'

export { clearAuthSession, getStoredUser, saveAuthSession }

export const signup = ({ email, name, password }) =>
  apiPost('/api/v1/auth/signup', { email, name, password }, { auth: false })

export const login = ({ email, password }) =>
  apiPost('/api/v1/auth/login', { email, password }, { auth: false })

export const exchangeOAuthCode = (code) =>
  apiPost('/api/v1/auth/oauth/token', { code }, { auth: false })

export const logout = async () => {
  const refreshToken = localStorage.getItem('refreshToken')
  try {
    if (getAccessToken() && refreshToken) await apiPost('/api/v1/auth/logout', { refreshToken })
  } catch {
    // 서버 로그아웃 실패와 무관하게 로컬 세션은 지운다
  } finally {
    clearAuthSession()
  }
}

export const getMe = () => apiGet('/api/v1/auth/me')

// 로그인을 시작한 프론트 Origin을 함께 보내, 백엔드가 로그인 후 같은 프론트로 되돌려 보내게 한다.
export const getGoogleOAuthUrl = () => {
  const path = '/api/oauth2/authorization/google'
  const query = `?frontend=${encodeURIComponent(window.location.origin)}`
  if (BACKEND_BASE_URL && BACKEND_BASE_URL !== '/') {
    return new URL(path, `${BACKEND_BASE_URL}/`).toString() + query
  }
  return path + query
}
