<template>
  <div>
    <PageHeader title="FT 검토" subtitle="채점된 응시 건을 검토해 최종 점수를 확정하고, 과제별 결과 공개 시각을 정합니다." />

    <!-- 넓은 화면: 왼쪽 검토 목록(+공개 시각), 오른쪽 선택한 건의 상세. 좁은 화면은 위아래로 쌓는다. -->
    <div class="grid items-start gap-3 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <div class="min-w-0 space-y-3">
        <section class="rounded-card border border-line bg-surface p-5" aria-labelledby="review-title">
          <div class="mb-3 flex items-baseline justify-between gap-3">
            <h2 id="review-title" class="text-[16px] font-semibold text-ink">검토 목록</h2>
            <span class="text-[12px] text-muted tabular-nums">FT 검토 대기 {{ reviews.filter((r) => r.stage === 'FT_REVIEW').length }}건 · 전체 {{ reviews.length }}건</span>
          </div>
          <p v-if="listError" class="mb-3 text-[13px] text-negative" role="alert">{{ listError }}</p>
          <p v-if="!reviews.length && !listError" class="rounded-card border border-dashed border-dash px-4 py-3 text-[13px] text-muted">검토 대상 세션이 없습니다.</p>
          <ul class="-mx-2 space-y-0.5">
            <li v-for="r in reviews" :key="r.id" class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-control px-2 py-1.5" :class="r.id === selectedId ? 'bg-active' : 'hover:bg-hover'">
              <button @click="select(r)" :aria-current="r.id === selectedId ? 'true' : undefined" class="min-h-11 min-w-0 flex-1 basis-48 text-left" :class="r.id === selectedId ? 'font-medium' : ''">
                <span class="block truncate text-[14px] font-medium text-ink">{{ r.scenarioTitle }}</span>
                <span class="block truncate text-[12px] text-muted">{{ r.participantName }} · {{ r.scenarioType === 'IN_BASKET' ? '서류함' : '역할수행' }} · {{ formatDate(r.endedAt) }}</span>
              </button>
              <button v-if="r.stage === 'FAILED'" @click="requeue(r)" :disabled="requeueingId === r.id" class="h-11 rounded-control btn-2 px-3 text-[13px] font-medium text-negative disabled:opacity-50 md:h-8">재채점 요청</button>
              <StatusPill :tone="toneOf(r.stage)" :label="STAGE_LABELS[r.stage] || r.stage" />
            </li>
          </ul>
        </section>

        <section class="rounded-card border border-line bg-surface p-5" aria-labelledby="release-title">
          <h2 id="release-title" class="text-[16px] font-semibold text-ink">결과 공개 시각</h2>
          <p class="mb-3 mt-1 text-[13px] text-muted">과제별 설정이며 실전 응시 결과에 적용됩니다. 이미 지난 공개 시각을 더 늦출 수는 없습니다.</p>
          <p v-if="releaseMessage" class="mb-3 text-[13px]" :class="releaseError ? 'text-negative' : 'text-positive'" role="status">{{ releaseMessage }}</p>
          <p v-if="!scenarios.length" class="rounded-card border border-dashed border-dash px-4 py-3 text-[13px] text-muted">등록된 과제가 없습니다.</p>
          <ul class="divide-y divide-rule border-t border-rule">
            <li v-for="s in scenarios" :key="s.id" class="py-3">
              <span class="block text-[14px] font-medium text-ink">{{ s.title }}</span>
              <span class="block text-[12px] text-muted">{{ s.type === 'IN_BASKET' ? '서류함' : '역할수행' }} · 현재 {{ s.resultReleaseAt ? formatDate(s.resultReleaseAt) : '미설정' }}</span>
              <div class="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                <div class="min-w-0 sm:flex-1"><input type="datetime-local" v-model="releaseInputs[s.id]" :aria-label="`${s.title} 공개 시각`" class="field-input" /></div>
                <button @click="saveRelease(s)" :disabled="!releaseInputs[s.id] || savingId === s.id" class="h-11 rounded-control btn-2 px-4 text-[14px] font-medium text-ink disabled:opacity-50 md:h-10">저장</button>
              </div>
            </li>
          </ul>
        </section>
      </div>

      <section v-if="selectedId" class="min-w-0 space-y-3" aria-label="검토 상세">
        <p v-if="detailError" class="rounded-card border border-line bg-surface px-5 py-6 text-[14px] text-negative" role="alert">{{ detailError }}</p>
        <div v-else-if="!detail" class="rounded-card border border-line bg-surface p-5" aria-busy="true" aria-label="불러오는 중"><div class="h-5 w-24 rounded-chip bg-rule"></div><div class="mt-4 h-4 w-full rounded-chip bg-rule"></div><div class="mt-2 h-4 w-4/5 rounded-chip bg-rule"></div></div>
        <template v-else>
          <div class="rounded-card border border-line bg-surface p-5">
            <h2 class="mb-3 text-[16px] font-semibold text-ink">{{ detail.scenarioType === 'IN_BASKET' ? '제출 답안' : '대화 기록' }}</h2>
            <ul v-if="detail.scenarioType === 'ROLE_PLAY'" class="space-y-2">
              <li v-for="t in detail.turns || []" :key="t.seq" class="whitespace-pre-wrap text-[14px] leading-6">
                <span class="font-semibold" :class="t.speaker === 'USER' ? 'text-ink' : 'text-muted'">{{ t.speaker === 'USER' ? '참가자' : '상대역' }}</span>
                <span class="text-ink"> {{ t.text }}</span>
              </li>
            </ul>
            <p v-else class="whitespace-pre-wrap text-[14px] leading-6 text-ink">{{ detail.answer }}</p>
          </div>

          <p v-if="!editable" class="text-[13px] text-muted">읽기 전용입니다{{ detail.status === 'SCORED' ? '' : ' (검토 가능한 단계가 아님)' }}.</p>

          <article v-for="e in detail.evaluations || []" :key="e.competency" class="rounded-card border border-line bg-surface p-5">
            <div class="mb-3 flex items-baseline justify-between gap-3">
              <h3 class="text-[16px] font-semibold text-ink">{{ e.competency }}</h3>
              <span class="flex shrink-0 items-center gap-3 text-[13px] text-muted"><span class="hidden w-24 gap-[2px] sm:flex" aria-hidden="true"><span v-for="n in 5" :key="n" class="h-1.5 flex-1 rounded-[2px]" :class="n <= Math.round(Number(e.aiScore) || 0) ? 'bg-accent' : 'bg-track'"></span></span><span>AI 점수 <b class="text-[16px] font-semibold tabular-nums text-ink">{{ e.aiScore }}</b> / 5</span></span>
            </div>
            <ul v-if="e.aiEvidence?.length" class="mb-3 space-y-1">
              <li v-for="(ev, i) in e.aiEvidence" :key="i" class="whitespace-pre-wrap rounded-control bg-ground px-3 py-2 text-[14px] leading-6 text-ink">“{{ ev }}”</li>
            </ul>
            <p class="whitespace-pre-wrap text-[14px] leading-6 text-ink">{{ e.aiFeedback }}</p>

            <div class="mt-3 border-t border-rule pt-3">
              <template v-if="editable && forms[e.competency]">
                <label :for="`score-${e.competency}`" class="mb-1 block text-[13px] font-medium text-ink">최종 점수 (1~5 정수)</label>
                <div class="w-28"><input :id="`score-${e.competency}`" type="number" min="1" max="5" step="1" :placeholder="`AI ${e.aiScore}점`" v-model.number="forms[e.competency].finalScore" class="field-input tabular-nums" /></div>
                <label :for="`comment-${e.competency}`" class="mb-1 mt-3 block text-[13px] font-medium text-ink">FT 코멘트</label>
                <textarea :id="`comment-${e.competency}`" v-model="forms[e.competency].ftComment" rows="3" class="w-full resize-y rounded-control border border-control bg-surface p-3 text-[14px] leading-6 text-ink focus-visible:border-accent"></textarea>
              </template>
              <template v-else>
                <p class="text-[14px] text-ink">최종 점수: <b class="tabular-nums">{{ e.finalScore ?? '-' }}</b></p>
                <p v-if="e.ftComment" class="mt-1 whitespace-pre-wrap text-[14px] leading-6 text-ink">{{ e.ftComment }}</p>
              </template>
            </div>
          </article>

          <div v-if="editable" class="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface p-5">
            <p class="text-[13px] text-muted">역량 {{ (detail.evaluations || []).length }}개의 최종 점수를 모두 입력한 뒤 확정합니다.</p>
            <p v-if="confirmError" class="mb-3 text-[13px] text-negative" role="alert">{{ confirmError }}</p>
            <button @click="confirm" :disabled="confirming" class="h-11 w-full rounded-control bg-primary px-6 text-[14px] font-medium text-white hover:bg-primaryHover disabled:opacity-50 sm:w-auto md:h-10">확정</button>
          </div>
        </template>
      </section>
      <div v-else class="hidden min-h-[200px] items-center justify-center self-stretch rounded-card border border-dashed border-dash px-5 py-10 text-center text-[14px] text-muted lg:flex">왼쪽 검토 목록에서 응시 건을 고르면 답안과 채점 내용이 여기에 보입니다.</div>
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
import { STAGE_LABELS, formatDate } from '../composables/stage';
import PageHeader from '../components/ui/PageHeader.vue';
import StatusPill from '../components/ui/StatusPill.vue';

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

const toneOf = (stage) => {
  if (stage === 'FT_REVIEW') return 'warning';
  if (stage === 'FAILED' || stage === 'ABORTED') return 'negative';
  if (stage === 'RESULT_READY' || stage === 'RESULT_PENDING') return 'accent';
  return 'neutral';
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
