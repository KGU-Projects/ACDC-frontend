<template>
  <div class="bg-slate-50 min-h-screen p-3 sm:p-4">
    <div class="max-w-3xl mx-auto space-y-4">
      <header class="bg-white rounded-2xl shadow px-5 py-4 flex items-center justify-between">
        <h1 class="text-base font-extrabold text-slate-800">FT 검토</h1>
        <button @click="router.push('/home')" class="text-sm font-bold text-brand">홈으로</button>
      </header>

      <section class="bg-white rounded-2xl shadow p-5">
        <h2 class="text-sm font-bold text-slate-800 mb-1">결과 공개 시각</h2>
        <p class="text-[11px] text-slate-400 mb-3">과제별 설정이며 실전 응시 결과에 적용됩니다. 이미 지난 공개 시각을 더 늦출 수는 없습니다.</p>
        <p v-if="releaseMessage" class="mb-3 text-xs font-bold" :class="releaseError ? 'text-rose-500' : 'text-brand'">{{ releaseMessage }}</p>
        <p v-if="!scenarios.length" class="text-xs text-slate-400">등록된 과제가 없습니다.</p>
        <ul class="space-y-2">
          <li v-for="s in scenarios" :key="s.id" class="bg-slate-50 rounded-xl px-4 py-3">
            <span class="block text-sm font-bold text-slate-700">{{ s.title }}</span>
            <span class="block text-[11px] text-slate-400">{{ s.type === 'IN_BASKET' ? '서류함' : '역할수행' }} · 현재 {{ s.resultReleaseAt ? formatDate(s.resultReleaseAt) : '미설정' }}</span>
            <div class="mt-2 flex items-center gap-2">
              <input type="datetime-local" v-model="releaseInputs[s.id]" class="flex-grow min-w-0 border border-slate-200 rounded-lg px-2 py-1.5 text-xs" />
              <button @click="saveRelease(s)" :disabled="!releaseInputs[s.id] || savingId === s.id" class="rounded-lg bg-brand text-white px-3 py-1.5 text-xs font-bold disabled:opacity-60">저장</button>
            </div>
          </li>
        </ul>
      </section>

      <section class="bg-white rounded-2xl shadow p-5">
        <h2 class="text-sm font-bold text-slate-800 mb-3">검토 목록</h2>
        <p v-if="listError" class="mb-3 text-xs font-bold text-rose-500">{{ listError }}</p>
        <p v-if="!reviews.length" class="text-xs text-slate-400">검토 대상 세션이 없습니다.</p>
        <ul class="space-y-2">
          <li v-for="r in reviews" :key="r.id" class="bg-slate-50 rounded-xl px-4 py-3 flex items-center justify-between gap-2" :class="r.id === selectedId ? 'ring-2 ring-brand' : ''">
            <button @click="select(r)" class="text-left flex-grow min-w-0">
              <span class="block text-sm font-bold text-slate-700">{{ r.scenarioTitle }}</span>
              <span class="block text-[11px] text-slate-400">{{ r.participantName }} · {{ r.scenarioType === 'IN_BASKET' ? '서류함' : '역할수행' }} · {{ formatDate(r.endedAt) }}</span>
            </button>
            <button v-if="r.stage === 'FAILED'" @click="requeue(r)" :disabled="requeueingId === r.id" class="text-[11px] font-bold px-2 py-1 rounded-lg border border-rose-300 text-rose-500 disabled:opacity-60">재채점 요청</button>
            <span class="text-[11px] font-bold px-2 py-1 rounded-full whitespace-nowrap" :class="badgeClass(r.stage)">{{ STAGE_LABELS[r.stage] || r.stage }}</span>
          </li>
        </ul>
      </section>

      <section v-if="selectedId" class="space-y-4">
        <p v-if="detailError" class="text-center text-rose-500 font-bold text-sm">{{ detailError }}</p>
        <p v-else-if="!detail" class="text-center text-slate-400 text-sm">불러오는 중...</p>
        <template v-else>
          <div class="bg-white rounded-2xl shadow p-5">
            <h2 class="text-sm font-bold text-slate-800 mb-3">{{ detail.scenarioType === 'IN_BASKET' ? '제출 답안' : '대화 기록' }}</h2>
            <ul v-if="detail.scenarioType === 'ROLE_PLAY'" class="space-y-2">
              <li v-for="t in detail.turns || []" :key="t.seq" class="text-sm whitespace-pre-wrap">
                <span class="font-bold" :class="t.speaker === 'USER' ? 'text-brand' : 'text-slate-500'">{{ t.speaker === 'USER' ? '참가자' : '상대역' }}</span>
                <span class="text-slate-700"> {{ t.text }}</span>
              </li>
            </ul>
            <p v-else class="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{{ detail.answer }}</p>
          </div>

          <p v-if="!editable" class="text-xs text-slate-400 text-center">읽기 전용입니다{{ detail.status === 'SCORED' ? '' : ' (검토 가능한 단계가 아님)' }}.</p>

          <article v-for="e in detail.evaluations || []" :key="e.competency" class="bg-white rounded-2xl shadow p-5">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-base font-bold text-slate-800">{{ e.competency }}</h3>
              <span class="text-xs text-slate-500">AI 점수 <b class="text-brand text-base">{{ e.aiScore }}</b> / 5</span>
            </div>
            <ul v-if="e.aiEvidence?.length" class="space-y-1 mb-3">
              <li v-for="(ev, i) in e.aiEvidence" :key="i" class="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 whitespace-pre-wrap">“{{ ev }}”</li>
            </ul>
            <p class="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{{ e.aiFeedback }}</p>

            <div class="mt-3 border-t border-slate-100 pt-3">
              <template v-if="editable && forms[e.competency]">
                <label class="block text-xs font-bold text-slate-500 mb-1">최종 점수 (1~5 정수)</label>
                <input type="number" min="1" max="5" step="1" :placeholder="`AI ${e.aiScore}점`" v-model.number="forms[e.competency].finalScore" class="w-24 border border-slate-200 rounded-lg px-2 py-1.5 text-sm" />
                <label class="block text-xs font-bold text-slate-500 mt-3 mb-1">FT 코멘트</label>
                <textarea v-model="forms[e.competency].ftComment" rows="2" class="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm"></textarea>
              </template>
              <template v-else>
                <p class="text-sm text-slate-700">최종 점수: <b>{{ e.finalScore ?? '-' }}</b></p>
                <p v-if="e.ftComment" class="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{{ e.ftComment }}</p>
              </template>
            </div>
          </article>

          <div v-if="editable" class="bg-white rounded-2xl shadow p-5">
            <p v-if="confirmError" class="mb-3 text-xs font-bold text-rose-500">{{ confirmError }}</p>
            <button @click="confirm" :disabled="confirming" class="w-full rounded-xl bg-brand text-white py-3 text-sm font-bold disabled:opacity-60">확정</button>
          </div>
        </template>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  confirmEvaluations,
  getSession,
  listReviewSessions,
  listScenarios,
  requeueSession,
  setResultRelease
} from '../api/acdc';
import { getStoredUser } from '../api/auth';
import { STAGE_LABELS } from '../composables/stage';

const router = useRouter();

const scenarios = ref([]);
const releaseInputs = reactive({});
const releaseMessage = ref('');
const releaseError = ref(false);
const savingId = ref(null);

const reviews = ref([]);
const listError = ref('');
const requeueingId = ref(null);

const selectedId = ref(null);
const detail = ref(null);
const detailError = ref('');
const forms = reactive({});
const confirming = ref(false);
const confirmError = ref('');

const editable = computed(() => detail.value?.status === 'SCORED');

const formatDate = (value) => (value ? new Date(value).toLocaleString('ko-KR') : '');
const badgeClass = (stage) => {
  if (stage === 'FT_REVIEW') return 'bg-amber-100 text-amber-600';
  if (stage === 'FAILED' || stage === 'ABORTED') return 'bg-rose-100 text-rose-500';
  if (stage === 'RESULT_READY' || stage === 'RESULT_PENDING') return 'bg-brandLight text-brand';
  return 'bg-slate-200 text-slate-500';
};

// ISO 인스턴트 <-> datetime-local 값(브라우저 로컬 시각) 변환
const pad = (n) => String(n).padStart(2, '0');
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const toIsoInstant = (local) => new Date(local).toISOString();

const loadScenarios = async () => {
  const list = (await listScenarios()) || [];
  scenarios.value = list;
  list.forEach((s) => {
    releaseInputs[s.id] = toLocalInput(s.resultReleaseAt);
  });
};

const loadReviews = async () => {
  try {
    reviews.value = (await listReviewSessions()) || [];
    listError.value = '';
  } catch (error) {
    listError.value = error.message || '검토 목록을 불러오지 못했습니다.';
  }
};

const saveRelease = async (s) => {
  releaseMessage.value = '';
  releaseError.value = false;
  const value = releaseInputs[s.id];
  if (!value || Number.isNaN(new Date(value).getTime())) {
    releaseError.value = true;
    releaseMessage.value = '공개 시각을 올바르게 입력해 주세요.';
    return;
  }
  savingId.value = s.id;
  try {
    await setResultRelease(s.id, toIsoInstant(value));
    await loadScenarios();
    releaseMessage.value = `'${s.title}' 공개 시각을 저장했습니다.`;
  } catch (error) {
    releaseError.value = true;
    releaseMessage.value = error.message || '공개 시각을 저장하지 못했습니다.';
  } finally {
    savingId.value = null;
  }
};

const select = async (r) => {
  selectedId.value = r.id;
  detail.value = null;
  detailError.value = '';
  confirmError.value = '';
  Object.keys(forms).forEach((k) => delete forms[k]);
  try {
    const data = await getSession(r.id);
    if (selectedId.value !== r.id) return;
    (data.evaluations || []).forEach((e) => {
      forms[e.competency] = { finalScore: e.finalScore ?? null, ftComment: e.ftComment || '' };
    });
    detail.value = data;
  } catch (error) {
    if (selectedId.value === r.id) detailError.value = error.message || '상세를 불러오지 못했습니다.';
  }
};

const confirm = async () => {
  confirmError.value = '';
  const evaluations = detail.value?.evaluations || [];
  const items = [];
  for (const e of evaluations) {
    const f = forms[e.competency];
    const score = f?.finalScore;
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      confirmError.value = `'${e.competency}'의 최종 점수를 1~5 사이 정수로 입력해 주세요.`;
      return;
    }
    items.push({ competency: e.competency, finalScore: score, ftComment: f.ftComment || null });
  }
  if (!items.length) {
    confirmError.value = '확정할 평가가 없습니다.';
    return;
  }
  confirming.value = true;
  try {
    await confirmEvaluations(selectedId.value, items);
    const id = selectedId.value;
    await loadReviews();
    const r = reviews.value.find((x) => x.id === id);
    if (r) await select(r);
  } catch (error) {
    confirmError.value = error.message || '확정하지 못했습니다.';
  } finally {
    confirming.value = false;
  }
};

const requeue = async (r) => {
  requeueingId.value = r.id;
  listError.value = '';
  try {
    await requeueSession(r.id);
    if (selectedId.value === r.id) {
      selectedId.value = null;
      detail.value = null;
    }
    await loadReviews();
  } catch (error) {
    listError.value = error.message || '재채점을 요청하지 못했습니다.';
  } finally {
    requeueingId.value = null;
  }
};

onMounted(async () => {
  if (getStoredUser()?.role !== 'FT') {
    router.replace('/home');
    return;
  }
  try {
    await loadScenarios();
  } catch (error) {
    releaseError.value = true;
    releaseMessage.value = error.message || '과제 목록을 불러오지 못했습니다.';
  }
  await loadReviews();
});
</script>
