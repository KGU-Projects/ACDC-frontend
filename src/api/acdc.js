import { apiGet, apiPost, apiPut, apiRequest, apiUpload } from './client'

export const listScenarios = () => apiGet('/api/scenarios')

export const createSession = ({ scenarioId, participantName, timeLimitMinutes, mode }) =>
  apiPost('/api/sessions', { scenarioId, participantName, timeLimitMinutes, mode })

export const listSessions = () => apiGet('/api/sessions')
export const getSession = (id) => apiGet(`/api/sessions/${id}`)
export const saveAnswer = (id, text) => apiPut(`/api/sessions/${id}/answer`, { text })
// inputMode: 'VOICE'(음성 인식 결과를 고치지 않고 전송) | 'TEXT'(직접 입력하거나 고친 경우)
export const sendTurn = (id, text, inputMode = 'TEXT') =>
  apiPost(`/api/sessions/${id}/turns`, { text, inputMode })
export const sendEmotion = (id, payload) => apiPost(`/api/sessions/${id}/emotions`, payload)
export const sendAudioFeatures = (id, samples) =>
  apiPost(`/api/sessions/${id}/audio-features`, { samples })
// 녹화본을 이어서 올리면 recordingExpected: true, 프론트가 잰 값(끄덕임·기울임)이 있으면 frontendFeatures를 함께 보낸다.
// 둘 다 없으면 body 없이 보낸다.
export const submitSession = (id, { recordingExpected = false, frontendFeatures = null } = {}) => {
  const hasFeatures = frontendFeatures && Object.keys(frontendFeatures).length > 0
  const body = recordingExpected || hasFeatures ? { recordingExpected } : undefined
  if (body && hasFeatures) body.frontendFeatures = frontendFeatures
  return apiPost(`/api/sessions/${id}/submit`, body)
}
// 영상 없이 계속하기로 했음을 알려, 서버가 업로드 대기 없이 바로 채점하게 한다.
export const deleteRecording = (id) => apiRequest(`/api/sessions/${id}/recording`, { method: 'DELETE' })
export const uploadRecording = (id, blob, filename, onProgress) => {
  const form = new FormData()
  form.append('file', blob, filename)
  return apiUpload(`/api/sessions/${id}/recording`, form, { onProgress })
}
export const pauseSession = (id) => apiPost(`/api/sessions/${id}/pause`)
export const resumeSession = (id) => apiPost(`/api/sessions/${id}/resume`)
export const listReviewSessions = () => apiGet('/api/sessions/review')
export const confirmEvaluations = (id, items) => apiPut(`/api/sessions/${id}/evaluations`, items)
export const requeueSession = (id) => apiPost(`/api/sessions/${id}/requeue`)
export const setResultRelease = (scenarioId, releaseAt) =>
  apiPut(`/api/scenarios/${scenarioId}/result-release`, { releaseAt })
export const startPrep = (id) => apiPost(`/api/sessions/${id}/prep/start`)
export const startCall = (id) => apiPost(`/api/sessions/${id}/call/start`)

// FT 과제 등록
export const generateScenarios = (payload) => apiPost('/api/admin/scenarios/generate', payload)
export const createAdminScenario = (payload) => apiPost('/api/admin/scenarios', payload)
export const listAdminScenarios = () => apiGet('/api/admin/scenarios')
export const getAdminScenario = (id) => apiGet(`/api/admin/scenarios/${id}`)
export const generateRubric = (id, payload) => apiPost(`/api/admin/scenarios/${id}/rubric/generate`, payload)
export const updateAdminScenario = (id, payload) => apiPut(`/api/admin/scenarios/${id}`, payload)
