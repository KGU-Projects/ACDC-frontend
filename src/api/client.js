import { apiUrl } from '../config/env'

const ACCESS_KEY = 'accessToken'
const REFRESH_KEY = 'refreshToken'
const USER_ID_KEY = 'userId'
const AUTH_USER_KEY = 'authUser'

export const getAccessToken = () => localStorage.getItem(ACCESS_KEY)

export const saveAuthSession = (authData) => {
  localStorage.setItem(ACCESS_KEY, authData.accessToken)
  localStorage.setItem(REFRESH_KEY, authData.refreshToken)
  if (authData.user) {
    localStorage.setItem(USER_ID_KEY, String(authData.user.id))
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authData.user))
  }
}

export const clearAuthSession = () => {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_ID_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(AUTH_USER_KEY) || 'null')
  } catch {
    return null
  }
}

const parseBody = async (response) => {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

const rawFetch = (path, options, withAuth) => {
  const token = getAccessToken()
  return fetch(apiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(withAuth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  })
}

let refreshing = null

// refresh token으로 새 토큰을 받는다. 동시에 여러 요청이 401이어도 한 번만 호출한다.
const refreshSession = () => {
  if (!refreshing) {
    refreshing = (async () => {
      const refreshToken = localStorage.getItem(REFRESH_KEY)
      if (!refreshToken) throw new Error('저장된 refresh token이 없습니다.')
      const response = await rawFetch(
        '/api/v1/auth/reissue',
        { method: 'POST', body: JSON.stringify({ refreshToken }) },
        false
      )
      const body = await parseBody(response)
      if (!response.ok || body?.success === false || !body?.data?.accessToken) {
        throw new Error('세션이 만료되었습니다.')
      }
      const data = body.data
      localStorage.setItem(ACCESS_KEY, data.accessToken)
      if (data.refreshToken) localStorage.setItem(REFRESH_KEY, data.refreshToken)
      if (data.user) {
        localStorage.setItem(USER_ID_KEY, String(data.user.id))
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user))
      }
    })().finally(() => {
      refreshing = null
    })
  }
  return refreshing
}

const toError = (response, body) => {
  const error = new Error(body?.message || `요청 실패 (${response.status})`)
  error.status = response.status
  error.code = body?.code
  error.data = body?.data
  return error
}

/**
 * 백엔드 공통 봉투({success, code, message, data})를 풀어 data를 돌려준다.
 * 401이면 reissue를 한 번 시도한 뒤 재요청하고, 그래도 실패하면 로그아웃 처리 후 /login으로 보낸다.
 * options.auth === false 이면 토큰 없이 호출하고 재시도도 하지 않는다.
 */
export const apiRequest = async (path, options = {}) => {
  const { auth = true, ...fetchOptions } = options
  let response = await rawFetch(path, fetchOptions, auth)

  if (response.status === 401 && auth && localStorage.getItem(REFRESH_KEY)) {
    try {
      await refreshSession()
      response = await rawFetch(path, fetchOptions, auth)
    } catch {
      clearAuthSession()
      window.location.assign('/login')
      throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.')
    }
  }

  const body = await parseBody(response)
  const isApiFailure = body && typeof body === 'object' && body.success === false
  if (!response.ok || isApiFailure) throw toError(response, body)

  if (body && typeof body === 'object' && 'data' in body) return body.data
  return body
}

export const apiGet = (path) => apiRequest(path, { method: 'GET' })
export const apiPost = (path, payload, options = {}) =>
  apiRequest(path, {
    method: 'POST',
    body: payload === undefined ? undefined : JSON.stringify(payload),
    ...options
  })
export const apiPut = (path, payload) =>
  apiRequest(path, { method: 'PUT', body: JSON.stringify(payload) })
