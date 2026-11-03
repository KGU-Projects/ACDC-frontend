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

export const getGoogleOAuthUrl = () => {
  if (BACKEND_BASE_URL && BACKEND_BASE_URL !== '/') {
    return new URL('/api/oauth2/authorization/google', `${BACKEND_BASE_URL}/`).toString()
  }
  return '/api/oauth2/authorization/google'
}
