<template>
  <div class="bg-slate-50 min-h-screen p-3 sm:p-4">
    <div v-if="loadError" class="max-w-xl mx-auto mt-20 text-center">
      <p class="text-rose-500 font-bold mb-4">{{ loadError }}</p>
      <button @click="router.push('/home')" class="text-sm font-bold text-brand">홈으로</button>
    </div>

    <div v-else-if="session" class="max-w-7xl mx-auto flex flex-col h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-2rem)]">
      <header class="bg-white rounded-2xl shadow px-5 py-3 flex items-center justify-between mb-3">
        <div>
          <h1 class="text-base font-extrabold text-slate-800">{{ session.scenarioTitle }}</h1>
          <p class="text-[11px] text-slate-400">서류함 · {{ saveState }}</p>
        </div>
        <div class="flex items-center gap-3">
          <span class="font-mono text-lg font-bold" :class="remaining <= 300 ? 'text-rose-500' : 'text-slate-700'">{{ label }}</span>
          <button @click="submit" :disabled="submitting" class="bg-brand hover:bg-brandHover disabled:bg-slate-300 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">
            {{ submitting ? '채점 중...' : '제출' }}
          </button>
        </div>
      </header>

      <p v-if="errorMessage" class="mb-2 text-xs font-bold text-rose-500">{{ errorMessage }}</p>

      <div class="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-0">
        <section class="bg-white rounded-2xl shadow flex flex-col min-h-0">
          <div class="flex border-b border-slate-100 text-sm font-bold">
            <button v-for="t in tabs" :key="t.key" @click="tab = t.key" class="px-4 py-3 transition-colors" :class="tab === t.key ? 'text-brand border-b-2 border-brand' : 'text-slate-400'">{{ t.label }}</button>
          </div>

          <div class="p-5 overflow-y-auto text-sm text-slate-700 leading-relaxed">
            <div v-if="tab === 'guide'" class="space-y-4">
              <div v-if="scenario.situation"><h3 class="font-bold text-slate-800 mb-1">상황</h3><p class="whitespace-pre-wrap">{{ scenario.situation }}</p></div>
              <div v-if="scenario.participantRole"><h3 class="font-bold text-slate-800 mb-1">나의 역할</h3><p class="whitespace-pre-wrap">{{ scenario.participantRole }}</p></div>
              <div v-if="scenario.reportRequirements?.length">
                <h3 class="font-bold text-slate-800 mb-1">작성 요건</h3>
                <ul class="list-disc pl-5 space-y-1"><li v-for="(r, i) in scenario.reportRequirements" :key="i">{{ r }}</li></ul>
              </div>
            </div>

            <div v-else-if="tab === 'items'" class="space-y-3">
              <div v-for="item in scenario.items" :key="item.id" class="rounded-xl border border-slate-100 p-4">
                <h3 class="font-bold text-slate-800">안건 {{ item.id }}. {{ item.title }}</h3>
                <p class="mt-1 whitespace-pre-wrap">{{ item.body }}</p>
                <p v-if="item.deadline" class="mt-2 text-xs font-bold text-amber-600">기한: {{ item.deadline }}</p>
              </div>
            </div>

            <div v-else-if="tab === 'pdf'" class="h-[70vh]">
              <iframe :src="scenario.materialsPdf" title="과제 원본 PDF" class="w-full h-full rounded-xl border border-slate-200"></iframe>
              <a :href="scenario.materialsPdf" target="_blank" rel="noopener" class="inline-block mt-2 text-xs font-bold text-brand">새 탭에서 열기</a>
            </div>

            <div v-else class="space-y-4">
              <div v-for="m in scenario.materials" :key="m.id" class="rounded-xl border border-slate-100 p-4">
                <h3 class="font-bold text-slate-800 mb-2">{{ m.title }}</h3>
                <p class="whitespace-pre-wrap">{{ m.body }}</p>
              </div>
            </div>
          </div>
        </section>

        <section class="bg-white rounded-2xl shadow flex flex-col min-h-0 p-4">
          <label for="answer" class="text-sm font-bold text-slate-800 mb-2">답안</label>
          <textarea id="answer" v-model="answer" @input="scheduleSave" :disabled="submitting" class="flex-grow w-full resize-none rounded-xl bg-slate-50 border border-slate-200 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 p-4 text-sm leading-relaxed" :placeholder="scenario.answerTemplate || '답안을 작성하세요.'"></textarea>
        </section>
      </div>
    </div>

    <p v-else class="text-center text-slate-400 text-sm mt-20">불러오는 중...</p>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { FINISHED_STATUSES, getSession, saveAnswer, submitSession } from '../api/acdc';
import { remainingSeconds, useCountdown } from '../composables/useCountdown';

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

const flushSave = async () => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  const text = answer.value;
  if (!text.trim() || text === lastSaved) return;
  saveState.value = '저장 중...';
  try {
    await saveAnswer(sessionId, text);
    lastSaved = text;
    saveState.value = '자동 저장됨';
  } catch (error) {
    saveState.value = '저장 실패';
    errorMessage.value = error.message || '답안을 저장하지 못했습니다.';
  }
};

const scheduleSave = () => {
  saveState.value = '입력 중...';
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(flushSave, 1500);
};

const submit = async () => {
  if (submitting.value) return;
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
    router.replace(`/result/${sessionId}`);
  } catch (error) {
    errorMessage.value = error.message || '제출에 실패했습니다.';
    submitting.value = false;
  }
};

onMounted(async () => {
  try {
    const data = await getSession(sessionId);
    if (FINISHED_STATUSES.includes(data.status)) {
      router.replace(`/result/${sessionId}`);
      return;
    }
    session.value = data;
    answer.value = data.answer || '';
    lastSaved = answer.value;
    startCountdown(remainingSeconds(data), submit);
  } catch (error) {
    loadError.value = error.message || '세션을 불러오지 못했습니다.';
  }
});

onBeforeUnmount(() => {
  if (saveTimer) flushSave();
});
</script>
