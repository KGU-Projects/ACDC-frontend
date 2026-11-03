export const STAGE_LABELS = {
  WAITING: '채점 대기',
  AI_SCORING: 'AI 채점 중',
  FT_REVIEW: 'AI 채점 완료 · FT 검토 중',
  RESULT_PENDING: '결과 대기',
  RESULT_READY: '결과 확인',
  FAILED: '채점 실패',
  ABORTED: '중단됨'
}

export const isSubmittedStage = (stage) => stage !== 'IN_PROGRESS'

export const canOpenResult = (stage) => stage === 'RESULT_READY'

// 채점이 진행 중이라 상태가 바뀔 수 있는 단계. 홈 화면이 주기적으로 다시 불러온다.
const POLLING_STAGES = ['WAITING', 'AI_SCORING', 'FT_REVIEW', 'RESULT_PENDING']
export const isPolling = (stage) => POLLING_STAGES.includes(stage)
