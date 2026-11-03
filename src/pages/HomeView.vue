<template>
  <div class="bg-slate-50 min-h-screen flex items-center justify-center p-4">
    <div class="bg-white shadow-2xl rounded-[2.5rem] flex flex-col max-w-sm sm:max-w-2xl w-full overflow-hidden min-h-[85vh] relative">

      <div class="w-full px-6 pt-8 pb-4 flex justify-between items-center">
        <div class="text-xl font-extrabold text-slate-800 tracking-tight">AC/DC</div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-slate-500 font-medium">{{ user?.name }}<span v-if="user?.role === 'FT'" class="ml-1 text-brand font-bold">(FT)</span></span>
          <button v-if="user?.role === 'FT'" @click="router.push('/ft/review')" class="text-xs font-bold text-brand">FT 검토</button>
          <button @click="handleLogout" class="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors">로그아웃</button>
        </div>
      </div>

      <div class="px-6 pb-8 flex-grow overflow-y-auto">
        <div class="text-center mb-6">
          <h2 class="text-2xl font-bold text-slate-800 mb-1.5">역량평가 시뮬레이터</h2>
          <p class="text-slate-500 text-sm">연습할 과제 유형을 선택하세요.</p>
        </div>

        <p v-if="errorMessage" class="mb-4 text-xs font-bold text-rose-500 text-center">{{ errorMessage }}</p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div v-for="card in cards" :key="card.type" class="rounded-2xl border-2 p-5 flex flex-col" :class="card.type === selectedType ? 'border-brand bg-brandLight/30' : 'border-slate-100'">
            <button @click="selectType(card.type)" class="text-left">
              <span class="block text-lg font-bold text-slate-800">{{ card.title }}</span>
              <span class="block text-xs text-slate-500 mt-1">{{ card.desc }}</span>
            </button>

            <div v-if="card.type === selectedType" class="mt-4 space-y-2">
              <p v-if="loading" class="text-xs text-slate-400">불러오는 중...</p>
              <p v-else-if="!scenariosOf(card.type).length" class="text-xs text-slate-400">등록된 시나리오가 없습니다.</p>
              <div v-for="s in scenariosOf(card.type)" :key="s.id" class="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm">
                <span class="block font-bold text-slate-700">{{ s.title }}</span>
                <span class="block text-[11px] text-slate-400 mt-0.5">제한시간 {{ s.timeLimitMinutes }}분</span>
                <div class="mt-3 grid grid-cols-2 gap-2">
                  <button @click="start(s, 'PRACTICE')" :disabled="starting" class="rounded-lg border border-slate-200 hover:border-brand px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-60 transition-colors">연습</button>
                  <button @click="start(s, 'REAL')" :disabled="starting" class="rounded-lg bg-brand text-white px-3 py-2 text-xs font-bold disabled:opacity-60 transition-opacity">
                    실전
                    <span class="block text-[10px] font-medium opacity-80">과제당 1회, 일시정지 없음</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-8">
          <h3 class="text-sm font-bold text-slate-700 mb-3">내 기록</h3>
          <p v-if="!sessions.length" class="text-xs text-slate-400">아직 진행한 과제가 없습니다.</p>
          <ul v-else class="space-y-2">
            <li v-for="s in sessions" :key="s.id">
              <button @click="openSession(s)" :class="canOpenResult(s.stage) || s.stage === 'IN_PROGRESS' ? '' : 'cursor-default'" class="w-full flex items-center justify-between bg-slate-50 hover:bg-brandLight/40 rounded-xl px-4 py-3 text-left transition-colors">
                <span>
                  <span class="block text-sm font-bold text-slate-700">{{ s.scenarioTitle }}</span>
                  <span class="block text-[11px] text-slate-400">{{ typeLabel(s.scenarioType) }} · {{ modeLabel(s.mode) }} · {{ formatDate(s.createdAt) }}</span>
                </span>
                <span class="text-[11px] font-bold px-2 py-1 rounded-full" :class="badgeClass(s.stage)">{{ s.stage === 'IN_PROGRESS' ? '이어하기' : STAGE_LABELS[s.stage] || s.stage }}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { createSession, listScenarios, listSessions } from '../api/acdc';
import { canOpenResult, isPolling, STAGE_LABELS } from '../composables/stage';
import { getStoredUser, logout } from '../api/auth';

const router = useRouter();
const user = getStoredUser();

const cards = [
  { type: 'IN_BASKET', title: '서류함', desc: '결재함 안건을 파악하고 우선순위를 정해 답안을 작성합니다.' },
  { type: 'ROLE_PLAY', title: '역할수행', desc: 'AI 상대역과 음성·텍스트로 면담하며 문제를 해결합니다.' }
];

const scenarios = ref([]);
const sessions = ref([]);
const selectedType = ref('');
const loading = ref(true);
const starting = ref(false);
const errorMessage = ref('');

const scenariosOf = (type) => scenarios.value.filter((s) => s.type === type);
const typeLabel = (type) => (type === 'IN_BASKET' ? '서류함' : '역할수행');
const modeLabel = (mode) => (mode === 'REAL' ? '실전' : '연습');
const badgeClass = (stage) => {
  if (stage === 'IN_PROGRESS') return 'bg-amber-100 text-amber-600';
  if (canOpenResult(stage)) return 'bg-brandLight text-brand';
  if (stage === 'FAILED' || stage === 'ABORTED') return 'bg-rose-100 text-rose-500';
  return 'bg-slate-200 text-slate-500';
};
const formatDate = (value) => (value ? new Date(value).toLocaleString('ko-KR') : '');

const selectType = (type) => {
  selectedType.value = selectedType.value === type ? '' : type;
};

const load = async () => {
  try {
    const [scenarioList, sessionList] = await Promise.all([listScenarios(), listSessions()]);
    scenarios.value = scenarioList || [];
    sessions.value = sessionList || [];
  } catch (error) {
    errorMessage.value = error.message || '목록을 불러오지 못했습니다.';
  } finally {
    loading.value = false;
    syncPolling();
  }
};

let pollTimer = null;
let unmounted = false;
const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
};
const refreshSessions = async () => {
  try {
    sessions.value = (await listSessions()) || [];
  } catch {
    // 다음 주기에 다시 시도한다.
  }
  syncPolling();
};
const syncPolling = () => {
  if (unmounted) return;
  const needed = sessions.value.some((s) => isPolling(s.stage));
  if (needed && !pollTimer) pollTimer = setInterval(refreshSessions, 30000);
  else if (!needed) stopPolling();
};

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

const handleLogout = async () => {
  await logout();
  router.push('/login');
};

onMounted(load);
onBeforeUnmount(() => {
  unmounted = true;
  stopPolling();
});
</script>
