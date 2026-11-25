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

// 면담 영상 분석 상태(세션 응답의 recordingStatus). 안내할 필요가 없으면 null이다.
export const recordingNotice = (status) => {
  switch (status) {
    case 'AWAITING_UPLOAD':
      return { text: '영상 업로드 대기 중', tone: 'neutral' };
    case 'UPLOADED':
    case 'ANALYZING':
      return { text: '영상 분석 중', tone: 'neutral' };
    case 'FAILED':
      return { text: '영상 분석 실패(영상 없이 채점)', tone: 'negative' };
    default:
      return null;
  }
};

// 비언어 분석 항목 이름과 단위. 모르는 키는 이름·값만 보여 주고 좋고 나쁨은 해석하지 않는다.
export const NONVERBAL_LABELS = {
  // scale: 서버는 0~1 비율로 주므로 화면에는 100을 곱해 %로 보여 준다
  gaze_front_ratio: { label: '정면 응시 비율', unit: '%', scale: 100 },
  gaze_stability: { label: '시선 안정성', unit: '' },
  gaze_duration: { label: '평균 응시 지속 시간', unit: '초' },
  gaze_down_ratio: { label: '시선 하향 비율', unit: '%', scale: 100 },
  au4_activation: { label: '미간 활성', unit: '' },
  facial_asymmetry: { label: '얼굴 비대칭', unit: '' },
  tension_level: { label: '긴장 수준', unit: '' },
  positive_emotion: { label: '긍정 감정', unit: '' },
  nod_frequency: { label: '끄덕임', unit: '' },
  forward_lean_angle: { label: '앞으로 기울임', unit: '도' }
};

const pad = (n) => String(n).padStart(2, '0');
// 2026.11.03 14:05 형식으로 통일한다.
export const formatDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
