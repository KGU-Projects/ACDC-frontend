<template>
  <div class="flex-grow grid grid-cols-1 lg:grid-cols-5 gap-3 min-h-0" data-testid="prep-panel">
    <section class="lg:col-span-3 bg-white rounded-2xl shadow p-5 overflow-y-auto text-sm text-slate-700 leading-relaxed min-h-0">
      <div class="space-y-4">
        <a v-if="scenario.materialsPdf" :href="scenario.materialsPdf" target="_blank" rel="noopener" class="inline-block text-xs font-bold text-brand">과제 원본 PDF 보기 (새 탭)</a>
        <div v-if="scenario.situation"><h3 class="font-bold text-slate-800 mb-1">상황</h3><p class="whitespace-pre-wrap">{{ scenario.situation }}</p></div>
        <div v-if="scenario.participantRole"><h3 class="font-bold text-slate-800 mb-1">나의 역할</h3><p class="whitespace-pre-wrap">{{ scenario.participantRole }}</p></div>
        <div v-for="m in scenario.materials" :key="m.id" class="rounded-xl border border-slate-100 p-4">
          <h3 class="font-bold text-slate-800 mb-2">{{ m.title }}</h3>
          <p class="whitespace-pre-wrap">{{ m.body }}</p>
        </div>
      </div>
    </section>

    <section class="lg:col-span-2 flex flex-col gap-3 min-h-0">
      <div class="bg-white rounded-2xl shadow p-5 text-center">
        <div class="relative aspect-video max-w-[240px] mx-auto bg-slate-900 rounded-xl overflow-hidden mb-3" data-testid="prep-preview">
          <video ref="previewRef" autoplay muted playsinline class="w-full h-full object-cover -scale-x-100"></video>
          <p v-if="!stream" class="absolute inset-0 flex items-center justify-center text-xs text-white/60 px-3">카메라 미리보기 대기 중</p>
        </div>
        <p v-if="stream" class="text-[11px] font-bold mb-2" :class="micOk ? 'text-emerald-600' : 'text-amber-600'">{{ micOk ? '카메라 연결됨 · 마이크 연결됨' : '카메라 연결됨 · 마이크를 확인해 주세요' }}</p>
        <p class="text-xs text-slate-500 mb-1">과제 숙지 남은 시간</p>
        <p class="font-mono text-3xl font-extrabold text-slate-800">{{ remainingLabel }}</p>
        <p class="text-[11px] text-slate-400 mt-2 leading-relaxed">숙지 시간이 끝나면 자동으로 영상통화 면담이 시작됩니다.<br />면담은 카메라와 마이크를 켠 상태에서만 진행됩니다.</p>
        <p v-if="requesting" class="text-xs text-slate-500 mt-3">카메라와 마이크를 확인하는 중...</p>
        <div v-if="mediaError" class="mt-3">
          <p class="text-xs font-bold text-rose-500 leading-relaxed">{{ mediaError }}</p>
          <button @click="emit('retry-media')" :disabled="requesting" class="mt-2 text-xs font-bold text-brand disabled:text-slate-300">다시 요청</button>
        </div>
        <div class="flex gap-2 justify-center mt-4">
          <button @click="emit('start')" :disabled="!canStart" class="bg-brand hover:bg-brandHover disabled:bg-slate-300 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">역할 수행 시작</button>
          <button @click="emit('leave')" :disabled="!canStart" class="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">홈으로</button>
          <button v-if="showSkip" @click="emit('skip')" :disabled="!canStart" class="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">건너뛰기</button>
        </div>
      </div>

      <div class="flex-grow bg-white rounded-2xl shadow p-5 flex flex-col min-h-[200px]">
        <h3 class="text-sm font-bold text-slate-800 mb-1">분석용 메모</h3>
        <p class="text-[11px] text-slate-400 mb-2">이 브라우저에만 임시 저장되며 서버로 전송되지 않습니다.</p>
        <textarea v-model="memo" class="flex-grow resize-none rounded-xl bg-slate-50 border border-slate-200 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 p-3 text-sm" placeholder="자료를 읽으며 분석한 내용을 적어 두세요"></textarea>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';

const props = defineProps({
  scenario: { type: Object, default: () => ({}) },
  remainingLabel: { type: String, default: '00:00' },
  canStart: { type: Boolean, default: true },
  mediaError: { type: String, default: '' },
  requesting: { type: Boolean, default: false },
  showSkip: { type: Boolean, default: false },
  stream: { type: Object, default: null },
  sessionId: { type: [String, Number], required: true }
});
const emit = defineEmits(['start', 'skip', 'retry-media', 'leave']);

// 미리보기는 표시 전용이다. 스트림을 화면에 붙일 뿐 수집·전송은 하지 않는다.
const previewRef = ref(null);
const micOk = computed(() => (props.stream?.getAudioTracks?.() || []).some((t) => t.readyState === 'live'));
const bindPreview = async () => {
  await nextTick();
  if (previewRef.value && props.stream) {
    previewRef.value.srcObject = props.stream;
    previewRef.value.play?.().catch(() => {});
  }
};
watch(() => props.stream, bindPreview);
onMounted(bindPreview);

const storageKey = `prep-memo:${props.sessionId}`;
const readMemo = () => {
  try {
    return sessionStorage.getItem(storageKey) || '';
  } catch (e) {
    return '';
  }
};
const memo = ref(readMemo());
watch(memo, (value) => {
  try {
    sessionStorage.setItem(storageKey, value);
  } catch (e) {
    // 저장소를 쓸 수 없어도 메모 입력은 계속된다.
  }
});
</script>
