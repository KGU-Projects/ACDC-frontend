import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { createSession, listScenarios, listSessions } from '../api/acdc';
import { getStoredUser } from '../api/client';
import { canOpenResult, isPolling } from './stage';

// 모듈 단위 싱글턴: 셸 배지와 각 화면이 같은 상태·같은 타이머 하나를 공유한다.
const scenarios = ref([]);
const sessions = ref([]);
const loading = ref(true);
const starting = ref(false);
const errorMessage = ref('');

let pollTimer = null;
let consumers = 0; // 마운트된 useSessions 사용처 수. 0이면 "언마운트됨"으로 보고 타이머를 만들지 않는다.
let inflight = null;

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
};

const syncPolling = () => {
  if (consumers === 0) return;
  const needed = sessions.value.some((s) => isPolling(s.stage));
  if (needed && !pollTimer) pollTimer = setInterval(refreshSessions, 30000);
  else if (!needed) stopPolling();
};

async function refreshSessions() {
  try {
    sessions.value = (await listSessions()) || [];
  } catch {
    // 다음 주기에 다시 시도한다.
  }
  syncPolling();
}

// 시나리오와 세션을 함께 조회한다. 진행 중인 조회가 있으면 그 결과를 같이 쓴다.
const refresh = () => {
  if (inflight) return inflight;
  inflight = (async () => {
    errorMessage.value = '';
    try {
      const [scenarioList, sessionList] = await Promise.all([listScenarios(), listSessions()]);
      scenarios.value = scenarioList || [];
      sessions.value = sessionList || [];
    } catch (error) {
      errorMessage.value = error.message || '목록을 불러오지 못했습니다.';
    } finally {
      loading.value = false;
      inflight = null;
      syncPolling();
    }
  })();
  return inflight;
};

const counts = computed(() => {
  const by = (pred) => sessions.value.filter((s) => pred(s.stage)).length;
  return {
    available: scenarios.value.length,
    inProgress: by((st) => st === 'IN_PROGRESS'),
    reviewing: by(isPolling),
    ready: by(canOpenResult)
  };
});

export function useSessions() {
  const router = useRouter();
  const user = getStoredUser();

  const goTo = (type, id) => router.push(`/${type === 'IN_BASKET' ? 'inbasket' : 'roleplay'}/${id}`);

  const start = async (scenario, mode) => {
    starting.value = true;
    errorMessage.value = '';
    try {
      const session = await createSession({ scenarioId: scenario.id, participantName: user?.name, mode });
      goTo(scenario.type, session.id);
    } catch (error) {
      errorMessage.value = error.message || '세션을 만들지 못했습니다.';
    } finally {
      starting.value = false;
    }
  };

  const openSession = (s) => {
    if (s.stage === 'IN_PROGRESS') goTo(s.scenarioType, s.id);
    else if (canOpenResult(s.stage)) router.push(`/result/${s.id}`);
  };

  onMounted(() => {
    consumers += 1;
    refresh();
  });
  onBeforeUnmount(() => {
    consumers -= 1;
    if (consumers === 0) {
      stopPolling();
      // 로그아웃 후 다른 계정이 들어와도 이전 목록이 비치지 않게 비운다.
      sessions.value = [];
      scenarios.value = [];
      loading.value = true;
    }
  });

  return { sessions, scenarios, loading, starting, errorMessage, counts, refresh, start, openSession };
}
