<template>
  <div>
    <PageHeader title="과제 등록" subtitle="원문이나 PDF로 과제를 만들고, 채점기준을 생성한 뒤 공개합니다." />

    <!-- 1. 과제 생성 -->
    <section class="mb-3 rounded-card border border-line bg-surface p-5" aria-labelledby="gen-title">
      <h2 id="gen-title" class="mb-3 text-[16px] font-semibold text-ink">새 과제 생성</h2>
      <div class="grid gap-4 lg:grid-cols-2">
        <div class="space-y-3">
          <div>
            <label for="gen-name" class="mb-1 block text-[13px] font-medium text-ink">제목 (선택)</label>
            <input id="gen-name" v-model="form.title" :disabled="generating" class="field-input" placeholder="비우면 자동으로 정합니다" />
          </div>
          <fieldset>
            <legend class="mb-1 text-[13px] font-medium text-ink">유형</legend>
            <label class="mr-4 inline-flex min-h-11 items-center gap-2 text-[14px] text-ink md:min-h-8"><input v-model="form.types" type="checkbox" value="IN_BASKET" :disabled="generating" />서류함</label>
            <label class="inline-flex min-h-11 items-center gap-2 text-[14px] text-ink md:min-h-8"><input v-model="form.types" type="checkbox" value="ROLE_PLAY" :disabled="generating" />역할수행</label>
          </fieldset>
          <div class="w-40">
            <label for="gen-time" class="mb-1 block text-[13px] font-medium text-ink">제한 시간 (분, 선택)</label>
            <input id="gen-time" v-model.number="form.timeLimitMinutes" type="number" min="1" :disabled="generating" class="field-input tabular-nums" />
          </div>
        </div>
        <ScenarioSourceInput id-prefix="gen" v-model:text="form.sourceText" v-model:files="form.files" :disabled="generating" />
      </div>
      <p v-if="generateError" class="mt-3 text-[13px] text-negative" role="alert">{{ generateError }}</p>
      <div class="mt-4 flex flex-wrap items-center gap-3">
        <button @click="generate" :disabled="generating || !canGenerate" class="h-11 rounded-control bg-primary px-5 text-[14px] font-medium text-white hover:bg-primaryHover disabled:opacity-50 md:h-10">{{ generating ? '생성 중...' : '과제 생성' }}</button>
        <span v-if="generating" class="text-[13px] text-muted" role="status">AI가 과제를 만드는 중입니다. 수십 초에서 수 분이 걸릴 수 있으니 이 화면을 닫지 마세요.</span>
        <span v-else-if="!canGenerate" class="text-[13px] text-muted">유형을 고르고 원문이나 PDF를 넣어 주세요.</span>
      </div>
    </section>

    <!-- 생성 미리보기: 저장 전 -->
    <section v-if="drafts.length" class="mb-3 space-y-3" aria-label="생성 결과 미리보기">
      <article v-for="(d, i) in drafts" :key="i" class="rounded-card border border-line bg-surface p-5">
        <div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 class="text-[15px] font-semibold text-ink">미리보기 · {{ typeLabel(d.type) }}</h3>
          <StatusPill :tone="d.saved ? 'positive' : 'warning'" :label="d.saved ? '저장됨(비공개)' : '저장 전'" />
        </div>
        <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
          <div>
            <label :for="`draft-title-${i}`" class="mb-1 block text-[13px] font-medium text-ink">제목</label>
            <input :id="`draft-title-${i}`" v-model="d.title" :disabled="d.saved" class="field-input" />
          </div>
          <div>
            <label :for="`draft-time-${i}`" class="mb-1 block text-[13px] font-medium text-ink">제한 시간(분)</label>
            <input :id="`draft-time-${i}`" v-model.number="d.timeLimitMinutes" type="number" min="1" :disabled="d.saved" class="field-input tabular-nums" />
          </div>
        </div>
        <pre class="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-control bg-ground p-3 text-[12px] leading-5 text-ink">{{ pretty(d.body) }}</pre>
        <p v-if="d.error" class="mt-2 text-[13px] text-negative" role="alert">{{ d.error }}</p>
        <div class="mt-3 flex gap-2">
          <button v-if="!d.saved" @click="saveDraft(d)" :disabled="d.saving || !d.title?.trim()" class="h-11 rounded-control bg-primary px-5 text-[14px] font-medium text-white hover:bg-primaryHover disabled:opacity-50 md:h-10">{{ d.saving ? '저장 중...' : '저장(비공개)' }}</button>
          <button v-if="!d.saved" @click="drafts.splice(i, 1)" :disabled="d.saving" class="h-11 rounded-control btn-2 px-4 text-[14px] font-medium text-ink md:h-10">버리기</button>
        </div>
      </article>
    </section>

    <!-- 2. 과제 목록·상세 -->
    <div class="grid items-start gap-3 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <section class="min-w-0 rounded-card border border-line bg-surface p-5" aria-labelledby="list-title">
        <div class="mb-3 flex items-baseline justify-between gap-3">
          <h2 id="list-title" class="text-[16px] font-semibold text-ink">등록된 과제</h2>
          <span class="text-[12px] text-muted tabular-nums">{{ scenarios.length }}건</span>
        </div>
        <p v-if="listError" class="mb-3 text-[13px] text-negative" role="alert">{{ listError }}</p>
        <p v-else-if="!scenarios.length && !loadingList" class="rounded-card border border-dashed border-dash px-4 py-3 text-[13px] text-muted">등록된 과제가 없습니다.</p>
        <ul class="-mx-2 space-y-0.5">
          <li v-for="s in scenarios" :key="s.id">
            <button @click="select(s.id)" :aria-current="s.id === selectedId ? 'true' : undefined" class="min-h-11 w-full rounded-control px-2 py-1.5 text-left" :class="s.id === selectedId ? 'bg-active' : 'hover:bg-hover'">
              <span class="block truncate text-[14px] font-medium text-ink">{{ s.title }}</span>
              <span class="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
                {{ typeLabel(s.type) }} · {{ s.timeLimitMinutes }}분
                <StatusPill :tone="s.published ? 'accent' : 'neutral'" :label="s.published ? '공개' : '비공개'" />
                <StatusPill :tone="s.hasRubric ? 'positive' : 'warning'" :label="s.hasRubric ? '채점기준 있음' : '채점기준 없음'" />
                <StatusPill tone="neutral" :label="s.source === 'BUNDLED' ? '기본 제공' : '직접 등록'" />
              </span>
            </button>
          </li>
        </ul>
      </section>

      <section v-if="selectedId" class="min-w-0 space-y-3" aria-label="과제 상세">
        <p v-if="detailError" class="rounded-card border border-line bg-surface px-5 py-6 text-[14px] text-negative" role="alert">{{ detailError }}</p>
        <div v-else-if="!detail" class="rounded-card border border-line bg-surface p-5" aria-busy="true" aria-label="불러오는 중"><div class="h-5 w-24 rounded-chip bg-rule"></div><div class="mt-4 h-4 w-full rounded-chip bg-rule"></div></div>
        <template v-else>
          <div class="rounded-card border border-line bg-surface p-5">
            <div class="mb-1 flex flex-wrap items-baseline justify-between gap-2">
              <h2 class="text-[16px] font-semibold text-ink">{{ detail.title }}</h2>
              <span class="flex gap-1.5">
                <StatusPill :tone="detail.published ? 'accent' : 'neutral'" :label="detail.published ? '공개' : '비공개'" />
                <StatusPill :tone="hasRubric ? 'positive' : 'warning'" :label="hasRubric ? '채점기준 있음' : '채점기준 없음'" />
              </span>
            </div>
            <p class="text-[12px] text-muted">{{ typeLabel(detail.type) }} · {{ detail.timeLimitMinutes }}분 · {{ readOnly ? '기본 제공(읽기 전용)' : '직접 등록' }}</p>

            <template v-if="!readOnly">
              <div class="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
                <div>
                  <label for="edit-title" class="mb-1 block text-[13px] font-medium text-ink">제목</label>
                  <input id="edit-title" v-model="edit.title" class="field-input" />
                </div>
                <div>
                  <label for="edit-time" class="mb-1 block text-[13px] font-medium text-ink">제한 시간(분)</label>
                  <input id="edit-time" v-model.number="edit.timeLimitMinutes" type="number" min="1" class="field-input tabular-nums" />
                </div>
              </div>
              <button @click="saveBasics" :disabled="busy || !edit.title?.trim()" class="mt-3 h-11 rounded-control btn-2 px-4 text-[14px] font-medium text-ink disabled:opacity-50 md:h-10">제목·시간 저장</button>
            </template>

            <pre class="mt-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-control bg-ground p-3 text-[12px] leading-5 text-ink">{{ pretty(detail.body) }}</pre>
            <p v-if="detailMessage" class="mt-3 text-[13px]" :class="detailMessageError ? 'text-negative' : 'text-positive'" :role="detailMessageError ? 'alert' : 'status'">{{ detailMessage }}</p>
          </div>

          <!-- 채점기준 -->
          <div v-if="!readOnly" class="rounded-card border border-line bg-surface p-5">
            <h3 class="mb-1 text-[15px] font-semibold text-ink">채점기준</h3>
            <p class="mb-3 text-[13px] text-muted">FT 가이드(원문이나 PDF)를 넣고 생성하면 채점기준과 보강된 과제를 미리 볼 수 있습니다. 저장하기 전에는 반영되지 않습니다.</p>
            <ScenarioSourceInput id-prefix="rubric" v-model:text="rubricForm.sourceText" v-model:files="rubricForm.files" :disabled="rubricGenerating" />
            <p v-if="rubricError" class="mt-3 text-[13px] text-negative" role="alert">{{ rubricError }}</p>
            <div class="mt-3 flex flex-wrap items-center gap-3">
              <button @click="generateRubricDraft" :disabled="rubricGenerating" class="h-11 rounded-control bg-primary px-5 text-[14px] font-medium text-white hover:bg-primaryHover disabled:opacity-50 md:h-10">{{ rubricGenerating ? '생성 중...' : '채점기준 생성' }}</button>
              <span v-if="rubricGenerating" class="text-[13px] text-muted" role="status">수십 초에서 수 분이 걸릴 수 있으니 이 화면을 닫지 마세요.</span>
            </div>

            <div v-if="rubricDraft" class="mt-4 border-t border-rule pt-4">
              <h4 class="mb-2 text-[14px] font-semibold text-ink">채점기준 미리보기 (저장 전)</h4>
              <div class="space-y-3 text-[13px] leading-6 text-ink">
                <div>
                  <p class="font-medium text-muted">역량</p>
                  <pre class="max-h-60 overflow-auto whitespace-pre-wrap rounded-control bg-ground p-3 text-[12px] leading-5">{{ pretty(rubricDraft.rubric?.competencies) }}</pre>
                </div>
                <div>
                  <p class="font-medium text-muted">평가 척도</p>
                  <pre class="max-h-60 overflow-auto whitespace-pre-wrap rounded-control bg-ground p-3 text-[12px] leading-5">{{ pretty(rubricDraft.rubric?.ratingScale) }}</pre>
                </div>
                <div>
                  <p class="font-medium text-muted">피드백 포인트</p>
                  <pre class="max-h-60 overflow-auto whitespace-pre-wrap rounded-control bg-ground p-3 text-[12px] leading-5">{{ pretty(rubricDraft.rubric?.feedbackPoints) }}</pre>
                </div>
              </div>
              <div class="mt-3 flex gap-2">
                <button @click="saveRubric" :disabled="busy" class="h-11 rounded-control bg-primary px-5 text-[14px] font-medium text-white hover:bg-primaryHover disabled:opacity-50 md:h-10">{{ busy ? '저장 중...' : '채점기준 저장' }}</button>
                <button @click="rubricDraft = null" :disabled="busy" class="h-11 rounded-control btn-2 px-4 text-[14px] font-medium text-ink md:h-10">버리기</button>
              </div>
            </div>
          </div>

          <!-- 공개 -->
          <div v-if="!readOnly" class="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface p-5">
            <p class="text-[13px] text-muted">{{ publishHint }}</p>
            <button v-if="!detail.published" @click="setPublished(true)" :disabled="busy || !hasRubric" class="h-11 rounded-control bg-primary px-5 text-[14px] font-medium text-white hover:bg-primaryHover disabled:opacity-50 md:h-10">공개</button>
            <button v-else @click="setPublished(false)" :disabled="busy" class="h-11 rounded-control btn-2 px-5 text-[14px] font-medium text-ink disabled:opacity-50 md:h-10">비공개로 전환</button>
          </div>
        </template>
      </section>
      <div v-else class="hidden min-h-[200px] items-center justify-center self-stretch rounded-card border border-dashed border-dash px-5 py-10 text-center text-[14px] text-muted lg:flex">왼쪽 목록에서 과제를 고르면 내용과 채점기준을 관리할 수 있습니다.</div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import {
  createAdminScenario,
  generateRubric,
  generateScenarios,
  getAdminScenario,
  listAdminScenarios,
  updateAdminScenario
} from '../api/acdc';
import { filesToPayload } from '../composables/files';
import { typeLabel } from '../composables/stage';
import PageHeader from '../components/ui/PageHeader.vue';
import StatusPill from '../components/ui/StatusPill.vue';
import ScenarioSourceInput from '../components/ScenarioSourceInput.vue';

const pretty = (value) => (value == null ? '' : typeof value === 'string' ? value : JSON.stringify(value, null, 2));

// 생성
const form = reactive({ title: '', types: ['IN_BASKET', 'ROLE_PLAY'], timeLimitMinutes: null, sourceText: '', files: [] });
const generating = ref(false);
const generateError = ref('');
const drafts = ref([]);
const canGenerate = computed(() => form.types.length > 0 && (form.sourceText.trim() || form.files.length > 0));

const sourcePayload = async (source) => ({
  ...(source.sourceText.trim() ? { sourceText: source.sourceText.trim() } : {}),
  files: await filesToPayload(source.files)
});

const generate = async () => {
  if (generating.value || !canGenerate.value) return;
  generating.value = true;
  generateError.value = '';
  try {
    const payload = {
      ...(form.title.trim() ? { title: form.title.trim() } : {}),
      types: form.types,
      ...(form.timeLimitMinutes ? { timeLimitMinutes: form.timeLimitMinutes } : {}),
      ...(await sourcePayload(form))
    };
    const res = await generateScenarios(payload);
    drafts.value = (res.scenarios || []).map((s) => ({ ...s, saved: false, saving: false, error: '' }));
    if (!drafts.value.length) generateError.value = '생성된 과제가 없습니다. 원문을 바꿔 다시 시도해 주세요.';
  } catch (error) {
    generateError.value = error.message || '과제를 생성하지 못했습니다.';
  } finally {
    generating.value = false;
  }
};

const saveDraft = async (d) => {
  d.saving = true;
  d.error = '';
  try {
    const saved = await createAdminScenario({ type: d.type, title: d.title.trim(), timeLimitMinutes: d.timeLimitMinutes, body: d.body });
    d.saved = true;
    await loadList();
    if (saved?.id) select(saved.id);
  } catch (error) {
    d.error = error.message || '저장하지 못했습니다.';
  } finally {
    d.saving = false;
  }
};

// 목록
const scenarios = ref([]);
const loadingList = ref(true);
const listError = ref('');
const loadList = async () => {
  try {
    scenarios.value = (await listAdminScenarios()) || [];
    listError.value = '';
  } catch (error) {
    listError.value = error.message || '과제 목록을 불러오지 못했습니다.';
  } finally {
    loadingList.value = false;
  }
};

// 상세
const selectedId = ref(null);
const detail = ref(null);
const detailError = ref('');
const detailMessage = ref('');
const detailMessageError = ref(false);
const busy = ref(false);
const edit = reactive({ title: '', timeLimitMinutes: null });
const rubricForm = reactive({ sourceText: '', files: [] });
const rubricGenerating = ref(false);
const rubricError = ref('');
const rubricDraft = ref(null);

const readOnly = computed(() => detail.value?.source === 'BUNDLED');
// 목록의 hasRubric이 서버 기준이다. 상세 응답에 있으면 그것을 우선한다.
const hasRubric = computed(() => detail.value?.hasRubric ?? scenarios.value.find((s) => s.id === selectedId.value)?.hasRubric ?? false);
const publishHint = computed(() => {
  if (detail.value?.published) return '현재 참가자에게 공개되어 있습니다.';
  return hasRubric.value ? '채점기준이 있어 공개할 수 있습니다.' : '채점기준을 먼저 생성·저장해야 공개할 수 있습니다.';
});

const showMessage = (text, isError = false) => {
  detailMessage.value = text;
  detailMessageError.value = isError;
};

const load = async (id) => {
  detailError.value = '';
  try {
    detail.value = await getAdminScenario(id);
    edit.title = detail.value.title || '';
    edit.timeLimitMinutes = detail.value.timeLimitMinutes;
  } catch (error) {
    detailError.value = error.message || '과제를 불러오지 못했습니다.';
  }
};

const select = async (id) => {
  selectedId.value = id;
  detail.value = null;
  rubricDraft.value = null;
  rubricError.value = '';
  rubricForm.sourceText = '';
  rubricForm.files = [];
  showMessage('');
  await load(id);
};

const update = async (payload, done) => {
  busy.value = true;
  showMessage('');
  try {
    await updateAdminScenario(selectedId.value, payload);
    await Promise.all([load(selectedId.value), loadList()]);
    showMessage(done);
    return true;
  } catch (error) {
    showMessage(error.message || '저장하지 못했습니다.', true);
    return false;
  } finally {
    busy.value = false;
  }
};

const saveBasics = () => update({ title: edit.title.trim(), timeLimitMinutes: edit.timeLimitMinutes }, '저장했습니다.');
const setPublished = (published) => update({ published }, published ? '공개했습니다.' : '비공개로 전환했습니다.');

const generateRubricDraft = async () => {
  if (rubricGenerating.value) return;
  rubricGenerating.value = true;
  rubricError.value = '';
  rubricDraft.value = null;
  try {
    rubricDraft.value = await generateRubric(selectedId.value, await sourcePayload(rubricForm));
  } catch (error) {
    rubricError.value = error.message || '채점기준을 생성하지 못했습니다.';
  } finally {
    rubricGenerating.value = false;
  }
};

// 응답의 scenario(채점기준이 반영된 과제 본문)를 body로 PUT한다.
const saveRubric = async () => {
  if (await update({ body: rubricDraft.value.scenario }, '채점기준을 저장했습니다.')) rubricDraft.value = null;
};

onMounted(loadList);
</script>
