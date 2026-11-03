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
const loadFailed = ref(false);

let pollTimer = null;
let consumers = 0; // 마운트된 useSessions 사용처 수. 0이면 "언마운트됨"으로 보고 타이머를 만들지 않는다.
let inflight = null;
let epoch = 0; // 상태를 비울 때마다 올린다. 이전 epoch에서 시작한 응답은 버린다.
let loadedFor; // 현재 상태를 불러온 사용자 id

// 로그아웃·계정 전환·마지막 사용처 언마운트 시 호출. 진행 중이던 요청 결과는 버려진다.
export const resetSessions = () => {
  epoch += 1;
  stopPolling();
  inflight = null;
  loadedFor = undefined;
  sessions.value = [];
  scenarios.value = [];
  errorMessage.value = '';
  loadFailed.value = false;
  loading.value = true;
};

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
  const mine = epoch;
  try {
    const list = (await listSessions()) || [];
    if (mine !== epoch) return;
    sessions.value = list;
  } catch {
    // 다음 주기에 다시 시도한다.
  }
  if (mine === epoch) syncPolling();
}

// 시나리오와 세션을 함께 조회한다. 진행 중인 조회가 있으면 그 결과를 같이 쓴다.
// 다른 계정의 상태가 남아 있으면 먼저 비우고, 비운 뒤 도착한 이전 응답은 버린다.
const refresh = () => {
  const uid = getStoredUser()?.id;
  if (loadedFor !== undefined && loadedFor !== uid) resetSessions();
  if (inflight) return inflight;
  const mine = epoch;
  loadedFor = uid;
  const run = (async () => {
    errorMessage.value = '';
    if (loadFailed.value) loading.value = true; // 다시 시도 중에는 빈 상태가 아니라 자리표시를 보인다.
    loadFailed.value = false;
    try {
      const [scenarioList, sessionList] = await Promise.all([listScenarios(), listSessions()]);
      if (mine !== epoch) return;
      scenarios.value = scenarioList || [];
      sessions.value = sessionList || [];
    } catch (error) {
      if (mine !== epoch) return;
      errorMessage.value = error.message || '목록을 불러오지 못했습니다.';
      loadFailed.value = true;
    }
    loading.value = false;
    syncPolling();
  })().finally(() => {
    if (inflight === run) inflight = null;
  });
  inflight = run;
  return run;
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
    const mine = epoch;
    try {
      const session = await createSession({ scenarioId: scenario.id, participantName: user?.name, mode });
      if (mine !== epoch) return; // 요청 도중 계정이 바뀌었으면 이동하지 않는다.
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
    if (consumers === 0) resetSessions();
  });

  return { sessions, scenarios, loading, starting, errorMessage, loadFailed, counts, refresh, start, openSession };
}
