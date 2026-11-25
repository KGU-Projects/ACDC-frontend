// 과제의 평가 프롬프트 상태(서버 promptStatus) → 화면 표시
export const promptStatusView = (status, version) => {
  switch (status) {
    case 'ACTIVE':
      return { tone: 'positive', label: `프롬프트 v${version}`, hint: `v${version} 프롬프트로 채점합니다.` };
    case 'STALE':
      return { tone: 'warning', label: '프롬프트 재생성 필요', hint: '과제나 채점기준이 바뀌어 저장된 프롬프트를 쓰지 않습니다. 다시 생성하기 전까지 기본 방식으로 채점합니다.' };
    case 'INACTIVE':
      return { tone: 'neutral', label: '프롬프트 사용 안 함', hint: '저장된 프롬프트를 쓰지 않고 기본 방식으로 채점합니다.' };
    default:
      return { tone: 'neutral', label: '프롬프트 없음', hint: '과제와 채점기준으로 평가 AI에 줄 프롬프트를 만듭니다. 저장하기 전까지 기본 방식으로 채점합니다.' };
  }
};
