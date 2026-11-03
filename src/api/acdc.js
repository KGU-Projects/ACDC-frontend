import { apiGet, apiPost, apiPut } from './client'

export const listScenarios = () => apiGet('/api/scenarios')

export const createSession = ({ scenarioId, participantName, timeLimitMinutes, mode }) =>
  apiPost('/api/sessions', { scenarioId, participantName, timeLimitMinutes, mode })

export const listSessions = () => apiGet('/api/sessions')
export const getSession = (id) => apiGet(`/api/sessions/${id}`)
export const saveAnswer = (id, text) => apiPut(`/api/sessions/${id}/answer`, { text })
export const sendTurn = (id, text) => apiPost(`/api/sessions/${id}/turns`, { text })
export const sendEmotion = (id, payload) => apiPost(`/api/sessions/${id}/emotions`, payload)
export const sendAudioFeatures = (id, samples) =>
  apiPost(`/api/sessions/${id}/audio-features`, { samples })
export const submitSession = (id) => apiPost(`/api/sessions/${id}/submit`)
export const pauseSession = (id) => apiPost(`/api/sessions/${id}/pause`)
export const resumeSession = (id) => apiPost(`/api/sessions/${id}/resume`)
export const listReviewSessions = () => apiGet('/api/sessions/review')
export const confirmEvaluations = (id, items) => apiPut(`/api/sessions/${id}/evaluations`, items)
export const requeueSession = (id) => apiPost(`/api/sessions/${id}/requeue`)
export const setResultRelease = (scenarioId, releaseAt) =>
  apiPut(`/api/scenarios/${scenarioId}/result-release`, { releaseAt })

// TODO(Task 7): InBasketView/RolePlayView 이전 후 제거. 새 코드는 composables/stage.js를 쓴다.
export const FINISHED_STATUSES = ['SUBMITTED', 'SCORED', 'CONFIRMED']
