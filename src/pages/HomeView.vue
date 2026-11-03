<template>
  <div class="bg-slate-50 min-h-screen flex items-center justify-center p-4">
    <div class="bg-white shadow-2xl rounded-[2.5rem] flex flex-col max-w-sm sm:max-w-2xl w-full overflow-hidden min-h-[85vh] relative">

      <div class="w-full px-6 pt-8 pb-4 flex justify-between items-center">
        <div class="text-xl font-extrabold text-slate-800 tracking-tight">AC/DC</div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-slate-500 font-medium">{{ user?.name }}<span v-if="user?.role === 'FT'" class="ml-1 text-brand font-bold">(FT)</span></span>
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
              <button
                v-for="s in scenariosOf(card.type)"
                :key="s.id"
                @click="start(s)"
                :disabled="starting"
                class="w-full text-left bg-white border border-slate-200 hover:border-brand rounded-xl px-4 py-3 text-sm disabled:opacity-60 transition-colors"
              >
                <span class="block font-bold text-slate-700">{{ s.title }}</span>
                <span class="block text-[11px] text-slate-400 mt-0.5">제한시간 {{ s.timeLimitMinutes }}분 · 시작하기</span>
              </button>
            </div>
          </div>
        </div>

        <div class="mt-8">
          <h3 class="text-sm font-bold text-slate-700 mb-3">내 기록</h3>
          <p v-if="!sessions.length" class="text-xs text-slate-400">아직 진행한 과제가 없습니다.</p>
          <ul v-else class="space-y-2">
            <li v-for="s in sessions" :key="s.id">
              <button @click="openSession(s)" class="w-full flex items-center justify-between bg-slate-50 hover:bg-brandLight/40 rounded-xl px-4 py-3 text-left transition-colors">
                <span>
                  <span class="block text-sm font-bold text-slate-700">{{ s.scenarioTitle }}</span>
                  <span class="block text-[11px] text-slate-400">{{ typeLabel(s.scenarioType) }} · {{ formatDate(s.createdAt) }}</span>
                </span>
                <span class="text-[11px] font-bold px-2 py-1 rounded-full" :class="finished(s) ? 'bg-brandLight text-brand' : 'bg-amber-100 text-amber-600'">{{ finished(s) ? '결과 보기' : '이어하기' }}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { createSession, FINISHED_STATUSES, listScenarios, listSessions } from '../api/acdc';
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
const finished = (s) => FINISHED_STATUSES.includes(s.status);
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
  }
};

const goTo = (type, id) => router.push(`/${type === 'IN_BASKET' ? 'inbasket' : 'roleplay'}/${id}`);

const start = async (scenario) => {
  starting.value = true;
  errorMessage.value = '';
  try {
    const session = await createSession({ scenarioId: scenario.id, participantName: user?.name });
    goTo(scenario.type, session.id);
  } catch (error) {
    errorMessage.value = error.message || '세션을 만들지 못했습니다.';
  } finally {
    starting.value = false;
  }
};

const openSession = (s) => {
  if (finished(s)) router.push(`/result/${s.id}`);
  else goTo(s.scenarioType, s.id);
};

const handleLogout = async () => {
  await logout();
  router.push('/login');
};

onMounted(load);
</script>
