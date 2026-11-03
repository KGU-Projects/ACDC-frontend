<template>
  <div class="flex min-h-screen flex-col bg-ground lg:h-screen">
    <div v-if="loadError" class="mx-auto mt-24 max-w-xl px-4 text-center">
      <p class="mb-4 text-[14px] text-negative" role="alert">{{ loadError }}</p>
      <button @click="router.push('/home')" class="h-11 rounded-control btn-2 px-4 text-[14px] font-medium text-ink md:h-10">홈으로</button>
    </div>

    <template v-else-if="session">
      <header class="sticky top-0 z-30 flex min-h-12 flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-surface px-4 py-1.5 lg:static">
        <BrandMark size="sm" class="hidden shrink-0 sm:inline-flex" />
        <div class="min-w-0 flex-1 basis-40">
          <h1 class="truncate text-[14px] font-medium leading-5 text-ink">{{ session.scenarioTitle }}</h1>
          <p class="truncate text-[12px] leading-4 text-muted" aria-live="polite">서류함<span v-if="saveState"> · {{ saveState }}</span></p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <span class="mr-1 text-[16px] font-semibold tabular-nums" :class="remaining <= 300 ? 'text-negative' : 'text-ink'" role="timer"><span class="sr-only">남은 시간 </span>{{ label }}</span>
          <button v-if="session.mode === 'PRACTICE'" @click="saveAndLeave" :disabled="submitting || leaving" class="h-11 rounded-control btn-2 px-3 text-[14px] font-medium text-ink disabled:opacity-50 md:h-9">
            {{ leaving ? '저장 중...' : '임시 저장 후 나가기' }}
          </button>
          <button @click="submit" :disabled="submitting || leaving" class="h-11 rounded-control bg-primary px-5 text-[14px] font-medium text-white hover:bg-primaryHover disabled:opacity-50 md:h-9">
            {{ submitting ? '제출 중...' : '제출' }}
          </button>
        </div>
      </header>

      <p v-if="errorMessage" class="border-b border-line bg-surface px-4 py-2 text-[13px] text-negative" role="alert">{{ errorMessage }}</p>

      <div class="grid flex-1 grid-cols-1 gap-4 p-4 lg:min-h-0 lg:grid-cols-2">
        <section class="flex min-h-[60vh] flex-col rounded-card border border-line bg-surface lg:min-h-0" aria-label="평가 자료">
          <div class="flex shrink-0 gap-1 overflow-x-auto border-b border-line px-2">
            <button
              v-for="t in tabs"
              :key="t.key"
              @click="tab = t.key"
              :aria-current="tab === t.key ? 'true' : undefined"
              class="-mb-px h-11 shrink-0 whitespace-nowrap border-b-2 px-3 text-[14px] md:h-10"
              :class="tab === t.key ? 'border-ink font-medium text-ink' : 'border-transparent text-muted hover:text-ink'"
            >{{ t.label }}</button>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto p-5 text-[14px] leading-6 text-ink">
            <div v-if="tab === 'guide'" class="space-y-5">
              <div v-if="scenario.situation"><h3 class="mb-1 text-[14px] font-semibold text-ink">상황</h3><p class="whitespace-pre-wrap">{{ scenario.situation }}</p></div>
              <div v-if="scenario.participantRole"><h3 class="mb-1 text-[14px] font-semibold text-ink">나의 역할</h3><p class="whitespace-pre-wrap">{{ scenario.participantRole }}</p></div>
              <div v-if="scenario.reportRequirements?.length">
                <h3 class="mb-1 text-[14px] font-semibold text-ink">작성 요건</h3>
                <ul class="list-disc space-y-1 pl-5"><li v-for="(r, i) in scenario.reportRequirements" :key="i">{{ r }}</li></ul>
              </div>
            </div>

            <div v-else-if="tab === 'items'" class="divide-y divide-rule">
              <div v-for="item in scenario.items" :key="item.id" class="py-4 first:pt-0 last:pb-0">
                <h3 class="text-[14px] font-semibold text-ink">안건 {{ item.id }}. {{ item.title }}</h3>
                <p class="mt-1 whitespace-pre-wrap">{{ item.body }}</p>
                <p v-if="item.deadline" class="mt-2 text-[12px] text-muted">기한: {{ item.deadline }}</p>
              </div>
            </div>

            <div v-else-if="tab === 'pdf'" class="h-[70vh]">
              <iframe :src="scenario.materialsPdf" title="과제 원본 PDF" class="h-full w-full rounded-control border border-line"></iframe>
              <a :href="scenario.materialsPdf" target="_blank" rel="noopener" class="mt-2 inline-block text-[13px] text-ink underline underline-offset-2">새 탭에서 열기</a>
            </div>

            <div v-else class="divide-y divide-rule">
              <div v-for="m in scenario.materials" :key="m.id" class="py-4 first:pt-0 last:pb-0">
                <h3 class="mb-1 text-[14px] font-semibold text-ink">{{ m.title }}</h3>
                <p class="whitespace-pre-wrap">{{ m.body }}</p>
              </div>
            </div>
          </div>
        </section>

        <section class="flex min-h-[60vh] flex-col rounded-card border border-line bg-surface p-4 lg:min-h-0">
          <label for="answer" class="mb-2 text-[14px] font-semibold text-ink">답안</label>
          <textarea id="answer" v-model="answer" @input="scheduleSave" :disabled="submitting || leaving" class="w-full flex-1 resize-none rounded-control border border-control bg-surface p-3 text-[14px] leading-6 text-ink placeholder:text-faint disabled:bg-ground" :placeholder="scenario.answerTemplate || '답안을 작성하세요.'"></textarea>
        </section>
      </div>
    </template>

    <p v-else class="mt-24 text-center text-[14px] text-muted">불러오는 중...</p>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getSession, pauseSession, resumeSession, saveAnswer, submitSession } from '../api/acdc';
import { useCountdown } from '../composables/useCountdown';
import BrandMark from '../components/ui/BrandMark.vue';

const route = useRoute();
const router = useRouter();
const sessionId = route.params.id;

const session = ref(null);
const answer = ref('');
const tab = ref('guide');
const loadError = ref('');
const errorMessage = ref('');
const submitting = ref(false);
const saveState = ref('');
const leaving = ref(false);
const { remaining, label, start: startCountdown, stop: stopCountdown } = useCountdown();

const scenario = computed(() => session.value?.scenario || {});
const tabs = computed(() => [
  { key: 'guide', label: '상황·요건' },
  { key: 'items', label: '안건' },
  { key: 'materials', label: '자료' },
  ...(scenario.value.materialsPdf ? [{ key: 'pdf', label: '원본 PDF' }] : [])
]);

let saveTimer = null;
let lastSaved = '';
let paused = false; // 일시정지 이후에는 서버가 입력을 거부하므로 저장 요청을 보내지 않는다.

const flushSave = async () => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  const text = answer.value;
  if (paused || !text.trim() || text === lastSaved) return true;
  saveState.value = '저장 중...';
  try {
    await saveAnswer(sessionId, text);
    lastSaved = text;
    saveState.value = '자동 저장됨';
    return true;
  } catch (error) {
    saveState.value = '저장 실패';
    errorMessage.value = error.message || '답안을 저장하지 못했습니다.';
    return false;
  }
};

const saveAndLeave = async () => {
  if (leaving.value || submitting.value) return;
  leaving.value = true;
  errorMessage.value = '';
  stopCountdown(); // 저장·정지 도중 시간 만료 자동 제출이 끼어들지 않게 먼저 멈춘다.
  const resumeCountdown = () => {
    leaving.value = false;
    startCountdown(remaining.value, submit);
  };
  try {
    if (!(await flushSave())) {
      resumeCountdown();
      return;
    }
    await pauseSession(sessionId);
    paused = true;
    router.push('/home');
  } catch (error) {
    errorMessage.value = error.message || '임시 저장에 실패했습니다.';
    resumeCountdown();
  }
};

const scheduleSave = () => {
  saveState.value = '입력 중...';
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(flushSave, 1500);
};

const submit = async () => {
  if (submitting.value || leaving.value) return;
  if (!answer.value.trim()) {
    errorMessage.value = '답안을 작성한 뒤 제출해주세요.';
    return;
  }
  submitting.value = true;
  errorMessage.value = '';
  stopCountdown();
  try {
    await flushSave();
    await submitSession(sessionId);
    router.replace('/submitted');
  } catch (error) {
    errorMessage.value = error.message || '제출에 실패했습니다.';
    submitting.value = false;
  }
};

onMounted(async () => {
  try {
    const data = await getSession(sessionId);
    if (data.stage !== 'IN_PROGRESS') {
      router.replace('/home');
      return;
    }
    // 연습 세션은 나갈 때 일시정지되므로 진입 즉시 재개하고, 응답의 남은 시간으로 시작한다(서버가 정지 중이 아니면 no-op).
    const live = data.mode === 'PRACTICE' ? await resumeSession(sessionId) : data;
    session.value = data;
    answer.value = data.answer || '';
    lastSaved = answer.value;
    startCountdown(live.remainingSeconds ?? data.remainingSeconds, submit);
  } catch (error) {
    loadError.value = error.message || '세션을 불러오지 못했습니다.';
  }
});

onBeforeUnmount(() => {
  if (saveTimer && !paused && !leaving.value) flushSave();
});
</script>
