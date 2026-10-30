import { apiUrl, BACKEND_BASE_URL } from '../config/env'

const AUTH_USER_KEY = 'authUser'

const parseResponseBody = async (response) => {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

const authRequest = async (path, options = {}) => {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(localStorage.getItem('accessToken')
        ? { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
        : {}),
      ...(options.headers || {})
    }
  })
  const body = await parseResponseBody(response)
  const isApiFailure = body && typeof body === 'object' && body.success === false

  if (!response.ok || isApiFailure) {
    const error = new Error(body?.message || `인증 요청 실패 (${response.status})`)
    error.status = response.status
    error.code = body?.code
    error.data = body?.data
    throw error
  }

  if (body && typeof body === 'object' && 'data' in body) {
    return body.data
  }

  return body
}

const postAuth = (path, body) => {
  return authRequest(path, {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export const saveAuthSession = (authData) => {
  localStorage.setItem('accessToken', authData.accessToken)
  localStorage.setItem('refreshToken', authData.refreshToken)

  if (authData.user) {
    localStorage.setItem('userId', String(authData.user.id))
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authData.user))
  }
}

export const clearAuthSession = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('userId')
  localStorage.removeItem(AUTH_USER_KEY)
}

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(AUTH_USER_KEY) || 'null')
  } catch {
    return null
  }
}

export const signup = ({ email, name, password }) => {
  return postAuth('/api/v1/auth/signup', { email, name, password })
}

export const login = ({ email, password }) => {
  return postAuth('/api/v1/auth/login', { email, password })
}

export const exchangeOAuthCode = (code) => {
  return postAuth('/api/v1/auth/oauth/token', { code })
}

export const reissue = () => {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) throw new Error('저장된 refresh token이 없습니다.')
  return postAuth('/api/v1/auth/reissue', { refreshToken })
}

export const logout = (refreshToken) => {
  return postAuth('/api/v1/auth/logout', { refreshToken })
}

export const getMe = () => {
  return authRequest('/api/v1/auth/me', { method: 'GET' })
}

export const getGoogleOAuthUrl = () => {
  if (BACKEND_BASE_URL && BACKEND_BASE_URL !== '/') {
    return new URL('/api/oauth2/authorization/google', `${BACKEND_BASE_URL}/`).toString()
  }

  return '/api/oauth2/authorization/google'
}
