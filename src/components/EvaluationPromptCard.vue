<template>
  <div class="rounded-card border border-line bg-surface p-5">
    <div class="mb-1 flex flex-wrap items-baseline justify-between gap-2">
      <h3 class="text-[15px] font-semibold text-ink">평가 프롬프트</h3>
      <StatusPill :tone="status.tone" :label="status.label" />
    </div>
    <p class="mb-3 text-[13px] text-muted">{{ status.hint }}</p>

    <details class="mb-3">
      <summary class="cursor-pointer text-[13px] font-medium text-ink">추가 자료 (선택)</summary>
      <div class="mt-3">
        <ScenarioSourceInput id-prefix="prompt" v-model:text="source.sourceText" v-model:files="source.files" :disabled="generating" />
      </div>
    </details>

    <div class="flex flex-wrap items-center gap-3">
      <button @click="generate()" :disabled="generating || saving || !hasRubric" class="h-11 rounded-control bg-primary px-5 text-[14px] font-medium text-white hover:bg-primaryHover disabled:opacity-50 md:h-10">{{ generating ? '생성 중...' : '프롬프트 생성' }}</button>
      <button v-if="!draft" @click="startManual" :disabled="generating" class="h-11 rounded-control btn-2 px-4 text-[14px] font-medium text-ink disabled:opacity-50 md:h-10">직접 입력</button>
      <span v-if="generating" class="text-[13px] text-muted" role="status">AI가 평가 프롬프트를 만드는 중입니다. 수십 초에서 수 분이 걸릴 수 있으니 이 화면을 닫지 마세요.</span>
      <span v-else-if="!hasRubric" class="text-[13px] text-muted">채점기준을 먼저 저장해야 생성할 수 있습니다.</span>
    </div>
    <p v-if="message" class="mt-3 text-[13px]" :class="messageError ? 'text-negative' : 'text-positive'" :role="messageError ? 'alert' : 'status'">{{ message }}</p>

    <!-- 저장 전 초안 -->
    <div v-if="draft" class="mt-4 border-t border-rule pt-4">
      <h4 class="mb-2 text-[14px] font-semibold text-ink">{{ draft.manual ? '프롬프트 직접 입력' : '프롬프트 미리보기 (저장 전)' }}</h4>
      <div v-if="draft.preview" class="mb-3">
        <p class="mb-1 text-[13px] font-medium text-muted">요약</p>
        <pre class="max-h-60 overflow-auto whitespace-pre-wrap rounded-control bg-ground p-3 text-[13px] leading-6 text-ink">{{ draft.preview }}</pre>
        <p v-if="edited" class="mt-1 text-[12px] text-muted">아래 내용을 고쳐서 이 요약은 저장되지 않습니다.</p>
      </div>
      <label for="prompt-json" class="mb-1 block text-[13px] font-medium text-muted">프롬프트 (JSON)</label>
      <textarea id="prompt-json" v-model="draft.text" rows="14" spellcheck="false" :disabled="saving" class="w-full resize-y rounded-control border border-control bg-surface p-3 font-mono text-[12px] leading-5 text-ink focus-visible:border-accent disabled:bg-ground" :aria-invalid="parsed.error ? 'true' : undefined" aria-describedby="prompt-json-error"></textarea>
      <p id="prompt-json-error" class="mt-1 text-[12px] text-negative">{{ parsed.error }}</p>
      <div class="mt-3 flex gap-2">
        <button @click="save" :disabled="saving || Boolean(parsed.error)" class="h-11 rounded-control bg-primary px-5 text-[14px] font-medium text-white hover:bg-primaryHover disabled:opacity-50 md:h-10">{{ saving ? '저장 중...' : '저장하고 사용' }}</button>
        <button @click="draft = null" :disabled="saving" class="h-11 rounded-control btn-2 px-4 text-[14px] font-medium text-ink disabled:opacity-50 md:h-10">버리기</button>
      </div>
    </div>

    <!-- 저장된 버전 -->
    <p v-if="listError" class="mt-4 text-[13px] text-negative" role="alert">{{ listError }}</p>
    <ul v-else-if="versions.length" class="mt-4 divide-y divide-rule border-t border-rule">
      <li v-for="v in versions" :key="v.id" class="py-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="flex flex-wrap items-center gap-2 text-[13px] text-ink">
            <span class="font-medium tabular-nums">v{{ v.version }}</span>
            <span class="text-muted tabular-nums">{{ formatDate(v.createdAt) }}</span>
            <StatusPill v-if="v.active && !v.stale" tone="accent" label="사용 중" />
            <StatusPill v-if="v.stale" tone="warning" label="이전 과제 기준" />
          </span>
          <button @click="setActive(v, !v.active)" :disabled="saving || (!v.active && v.stale)" class="h-11 rounded-control btn-2 px-3 text-[13px] font-medium text-ink disabled:opacity-50 md:h-9">{{ v.active ? '사용 중지' : '이 버전 사용' }}</button>
        </div>
        <details class="mt-1">
          <summary class="cursor-pointer text-[12px] text-muted">내용 보기</summary>
          <pre v-if="v.preview" class="mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded-control bg-ground p-3 text-[13px] leading-6 text-ink">{{ v.preview }}</pre>
          <pre class="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded-control bg-ground p-3 text-[12px] leading-5 text-ink">{{ pretty(v.prompt) }}</pre>
        </details>
      </li>
    </ul>
  </div>
</template>

<script>
import { reactive as makeReactive } from 'vue';

// 화면을 옮겼다 돌아와도 같은 과제의 생성이 겹치지 않도록 진행 중 표시는 컴포넌트 밖에 둔다.
const generatingIds = makeReactive({});
</script>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { generateEvaluationPrompt, listEvaluationPrompts, saveEvaluationPrompt, setEvaluationPromptActive } from '../api/acdc';
import { filesToPayload } from '../composables/files';
import { promptStatusView } from '../composables/evaluationPrompt';
import { formatDate } from '../composables/stage';
import ScenarioSourceInput from './ScenarioSourceInput.vue';
import StatusPill from './ui/StatusPill.vue';

// 부모가 과제 id를 key로 주어 과제마다 새로 만든다. 그래서 초안·목록은 항상 이 과제의 것이고,
// 다른 과제를 고른 뒤 늦게 온 응답은 alive로 버린다.
const props = defineProps({
  scenarioId: { type: Number, required: true },
  hasRubric: { type: Boolean, default: false },
  promptStatus: { type: String, default: 'NONE' },
  promptVersion: { type: Number, default: null }
});
const emit = defineEmits(['changed']);

let alive = true;
onBeforeUnmount(() => { alive = false; });

const pretty = (value) => JSON.stringify(value, null, 2);
const status = computed(() => promptStatusView(props.promptStatus, props.promptVersion));
const source = reactive({ sourceText: '', files: [] });
const generating = computed(() => Boolean(generatingIds[props.scenarioId]));
const saving = ref(false);
const message = ref('');
const messageError = ref(false);
const showMessage = (text, isError = false) => {
  message.value = text;
  messageError.value = isError;
};

// 저장된 버전
const versions = ref([]);
const listError = ref('');
let listSeq = 0;
const loadVersions = async () => {
  const seq = (listSeq += 1);
  try {
    const data = (await listEvaluationPrompts(props.scenarioId)) || [];
    if (!alive || seq !== listSeq) return;
    versions.value = data;
    listError.value = '';
  } catch (error) {
    if (alive && seq === listSeq) listError.value = error.message || '평가 프롬프트를 불러오지 못했습니다.';
  }
};

// 초안: prompt의 구조는 AI 서버가 정한다. 화면은 JSON 객체인지만 확인한다.
const draft = ref(null);
const edited = computed(() => Boolean(draft.value) && draft.value.text !== draft.value.original);
const parsed = computed(() => {
  if (!draft.value) return { value: null, error: '' };
  try {
    const value = JSON.parse(draft.value.text);
    const isObject = value !== null && typeof value === 'object' && !Array.isArray(value);
    return isObject ? { value, error: '' } : { value: null, error: 'JSON 객체({ ... })여야 합니다.' };
  } catch {
    return { value: null, error: 'JSON 형식이 올바르지 않습니다.' };
  }
});

const startManual = () => {
  showMessage('');
  draft.value = { text: '{\n  \n}', original: null, preview: null, scenarioHash: null, manual: true };
};

// given을 주면(채점기준 저장 뒤 자동 생성) 그 자료로, 아니면 이 카드의 추가 자료로 생성한다.
const generate = async (given = null) => {
  const id = props.scenarioId;
  if (generatingIds[id]) return;
  generatingIds[id] = true;
  showMessage('');
  try {
    const input = given || source;
    const text = input.sourceText.trim();
    const res = await generateEvaluationPrompt(id, {
      ...(text ? { sourceText: text } : {}),
      files: await filesToPayload(input.files)
    });
    if (!alive) return;
    const original = pretty(res.prompt);
    draft.value = { text: original, original, preview: res.preview || null, scenarioHash: res.scenarioHash, manual: false };
  } catch (error) {
    if (alive) showMessage(error.message || '평가 프롬프트를 생성하지 못했습니다.', true);
  } finally {
    delete generatingIds[id];
  }
};

const save = async () => {
  const d = draft.value;
  if (!d || parsed.value.error || saving.value) return;
  saving.value = true;
  showMessage('');
  try {
    const saved = await saveEvaluationPrompt(props.scenarioId, {
      prompt: parsed.value.value,
      ...(d.preview && !edited.value ? { preview: d.preview } : {}),
      ...(d.scenarioHash ? { scenarioHash: d.scenarioHash } : {})
    });
    emit('changed');
    if (!alive) return;
    if (draft.value === d) draft.value = null;
    showMessage(
      saved.stale
        ? `v${saved.version} 버전을 저장했지만, 생성한 뒤 과제가 바뀌어 채점에 쓰이지 않습니다. 다시 생성해 주세요.`
        : `v${saved.version} 버전을 저장했습니다. 이제 이 프롬프트로 채점합니다.`,
      saved.stale
    );
    await loadVersions();
  } catch (error) {
    if (alive) showMessage(error.message || '저장하지 못했습니다.', true);
  } finally {
    saving.value = false;
  }
};

const setActive = async (v, active) => {
  if (saving.value) return;
  saving.value = true;
  showMessage('');
  try {
    await setEvaluationPromptActive(props.scenarioId, v.id, active);
    emit('changed');
    if (!alive) return;
    showMessage(active ? `v${v.version} 버전으로 채점합니다.` : '평가 프롬프트 사용을 중지했습니다. 기본 방식으로 채점합니다.');
    await loadVersions();
  } catch (error) {
    if (alive) showMessage(error.message || '변경하지 못했습니다.', true);
  } finally {
    saving.value = false;
  }
};

onMounted(loadVersions);
defineExpose({ generate, reload: loadVersions });
</script>
