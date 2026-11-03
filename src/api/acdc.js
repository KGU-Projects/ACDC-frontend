import { apiGet, apiPost, apiPut } from './client'

export const listScenarios = () => apiGet('/api/scenarios')

export const createSession = ({ scenarioId, participantName, timeLimitMinutes }) =>
  apiPost('/api/sessions', { scenarioId, participantName, timeLimitMinutes })

export const listSessions = () => apiGet('/api/sessions')
export const getSession = (id) => apiGet(`/api/sessions/${id}`)
export const saveAnswer = (id, text) => apiPut(`/api/sessions/${id}/answer`, { text })
export const sendTurn = (id, text) => apiPost(`/api/sessions/${id}/turns`, { text })
export const sendEmotion = (id, payload) => apiPost(`/api/sessions/${id}/emotions`, payload)
export const sendAudioFeatures = (id, samples) =>
  apiPost(`/api/sessions/${id}/audio-features`, { samples })
export const submitSession = (id) => apiPost(`/api/sessions/${id}/submit`)

export const FINISHED_STATUSES = ['SUBMITTED', 'SCORED', 'CONFIRMED']
