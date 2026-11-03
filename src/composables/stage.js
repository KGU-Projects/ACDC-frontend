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

export const typeLabel = (type) => (type === 'IN_BASKET' ? '서류함' : '역할수행');
export const modeLabel = (mode) => (mode === 'REAL' ? '실전' : '연습');

// 단계 알약 문구. 실전 결과는 공개 전까지 점수 없이 단계 이름만 보여 준다.
export const stageLabel = (stage) => (stage === 'IN_PROGRESS' ? '진행 중' : STAGE_LABELS[stage] || stage);
export const stageTone = (stage) => {
  if (stage === 'RESULT_READY') return 'accent';
  if (stage === 'RESULT_PENDING' || stage === 'FT_REVIEW') return 'warning';
  if (stage === 'FAILED' || stage === 'ABORTED') return 'negative';
  return 'neutral';
};

const pad = (n) => String(n).padStart(2, '0');
// 2026.11.03 14:05 형식으로 통일한다.
export const formatDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
