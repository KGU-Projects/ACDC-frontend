import { apiUrl } from '../config/env'
import { reissue, saveAuthSession, clearAuthSession } from './auth'

let isRefreshing = false
let refreshSubscribers = []

const onRefreshed = () => {
  refreshSubscribers.forEach((cb) => cb())
  refreshSubscribers = []
}

const getAccessToken = () => localStorage.getItem('accessToken') || ''

const createHeaders = (headers = {}) => {
  const accessToken = getAccessToken()

  return {
    'ngrok-skip-browser-warning': 'true',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...headers
  }
}

const parseResponseBody = async (response) => {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

const executeRequest = async (path, options = {}) => {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: createHeaders(options.headers)
  })
  const body = await parseResponseBody(response)
  const isApiFailure = body && typeof body === 'object' && body.success === false

  if (!response.ok || isApiFailure) {
    const error = new Error(body?.message || body?.error?.message || `API 요청 실패 (${response.status})`)
    error.status = response.status
    error.code = body?.code ?? body?.error?.code
    error.data = body?.data
    throw error
  }

  if (body && typeof body === 'object' && 'data' in body) {
    return body.data
  }

  return body
}

const request = async (path, options = {}) => {
  try {
    return await executeRequest(path, options)
  } catch (error) {
    if (error.status !== 401) throw error

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshSubscribers.push(async () => {
          try {
            resolve(await executeRequest(path, options))
          } catch (retryError) {
            reject(retryError)
          }
        })
      })
    }

    isRefreshing = true
    try {
      const authData = await reissue()
      saveAuthSession(authData)
      onRefreshed()
      return await executeRequest(path, options)
    } catch {
      clearAuthSession()
      window.location.href = '/login'
      throw error
    } finally {
      isRefreshing = false
    }
  }
}

const jsonRequest = (path, method, body) => {
  return request(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

export const createInterviewSession = () => {
  return request('/api/v1/sessions', { method: 'POST' })
}

export const startInterviewSession = (sessionId, setting) => {
  return jsonRequest(`/api/v1/sessions/${sessionId}/start`, 'POST', setting)
}

export const getInterviewSession = (sessionId) => {
  return request(`/api/v1/sessions/${sessionId}`)
}

export const updateInterviewSessionStatus = (sessionId, status) => {
  return jsonRequest(`/api/v1/sessions/${sessionId}/status`, 'PATCH', { status })
}

export const getInterviewSetting = (sessionId) => {
  return request(`/api/v1/preparation/settings/${sessionId}`)
}

export const getInterviewResult = (sessionId) => {
  return request(`/api/v1/interviews/${sessionId}/result`)
}

export const getInterviewHistory = () => {
  return request('/api/v1/interviews/history')
}

export const getInterviewReport = (sessionId) => {
  return request(`/api/v1/interviews/${sessionId}/report`)
}

export const retryInterviewReport = (sessionId) => {
  return request(`/api/v1/interviews/${sessionId}/report/retry`, { method: 'POST' })
}

export const getPresignedUrl = (sessionId, fileType) => {
  return jsonRequest(`/api/v1/sessions/${sessionId}/presigned`, 'POST', { fileType })
}

export const saveInterviewContentUrl = (sessionId, contentUrl, type = 'video') => {
  return jsonRequest(`/api/v1/sessions/${sessionId}/save`, 'POST', { type, contentUrl })
}
