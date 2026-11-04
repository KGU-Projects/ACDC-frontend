<template>
  <div class="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-5 lg:grid-rows-[minmax(0,1fr)]" data-testid="prep-panel">
    <section class="flex min-h-[60vh] flex-col rounded-card border border-line bg-surface text-[14px] leading-6 text-ink lg:col-span-3 lg:min-h-0" aria-label="과제 자료">
      <div v-if="scenario.materialsPdf" class="flex shrink-0 gap-1 border-b border-line px-2">
        <button v-for="t in materialTabs" :key="t.key" @click="materialTab = t.key" :aria-current="materialTab === t.key ? 'true' : undefined"
          class="-mb-px h-11 shrink-0 whitespace-nowrap border-b-2 px-3 text-[14px] md:h-10"
          :class="materialTab === t.key ? 'border-ink font-medium text-ink' : 'border-transparent text-muted hover:text-ink'">{{ t.label }}</button>
        <a v-if="materialTab === 'pdf'" :href="scenario.materialsPdf" target="_blank" rel="noopener" class="ml-auto flex shrink-0 items-center whitespace-nowrap px-3 text-[13px] text-muted underline underline-offset-2 hover:text-ink">새 탭에서 열기</a>
      </div>
      <iframe v-if="scenario.materialsPdf && materialTab === 'pdf'" :src="scenario.materialsPdf" title="과제 원본 PDF" class="block h-full min-h-[60vh] w-full flex-1 border-0 lg:min-h-0"></iframe>
      <div v-else class="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
        <div v-if="scenario.situation"><h3 class="mb-1 text-[14px] font-semibold">상황</h3><p class="whitespace-pre-wrap">{{ scenario.situation }}</p></div>
        <div v-if="scenario.participantRole"><h3 class="mb-1 text-[14px] font-semibold">나의 역할</h3><p class="whitespace-pre-wrap">{{ scenario.participantRole }}</p></div>
        <div v-for="m in scenario.materials" :key="m.id" class="border-t border-rule pt-4">
          <h3 class="mb-1 text-[14px] font-semibold">{{ m.title }}</h3>
          <p class="whitespace-pre-wrap">{{ m.body }}</p>
        </div>
      </div>
    </section>

    <section class="flex min-h-0 flex-col gap-4 lg:col-span-2">
      <div class="rounded-card border border-line bg-surface p-5">
        <div class="relative mx-auto mb-3 aspect-video max-w-[240px] overflow-hidden rounded-card bg-stage" data-testid="prep-preview">
          <video ref="previewRef" autoplay muted playsinline class="h-full w-full -scale-x-100 object-cover"></video>
          <p v-if="!stream" class="absolute inset-0 flex items-center justify-center px-3 text-[12px] text-white/75">카메라 미리보기 대기 중</p>
        </div>
        <p v-if="stream" class="mb-3 text-center text-[12px]" :class="micOk ? 'text-positive' : 'text-[var(--pill-warning-fg)]'">{{ micOk ? '카메라 연결됨 · 마이크 연결됨' : '카메라 연결됨 · 마이크를 확인해 주세요' }}</p>
        <p class="text-center text-[13px] text-muted">과제 숙지 남은 시간</p>
        <p class="text-center text-[32px] font-semibold leading-10 tabular-nums text-ink" role="timer"><span class="sr-only">남은 시간 </span>{{ remainingLabel }}</p>
        <p class="mt-2 text-center text-[12px] leading-5 text-muted">숙지 시간이 끝나면 자동으로 영상통화 면담이 시작됩니다.<br />면담은 카메라와 마이크를 켠 상태에서만 진행됩니다.</p>
        <p v-if="requesting" class="mt-3 text-center text-[13px] text-muted">카메라와 마이크를 확인하는 중...</p>
        <div v-if="mediaError" class="mt-3 text-center" role="alert">
          <p class="text-[13px] leading-5 text-negative">{{ mediaError }}</p>
          <button @click="emit('retry-media')" :disabled="requesting" class="mt-2 h-11 rounded-control btn-2 px-4 text-[14px] font-medium text-ink disabled:opacity-50 md:h-9">다시 요청</button>
        </div>
        <div class="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button @click="emit('start')" :disabled="!canStart" class="h-11 rounded-control bg-primary px-5 text-[14px] font-medium text-white hover:bg-primaryHover disabled:opacity-50 md:h-10">역할 수행 시작</button>
          <button @click="emit('leave')" :disabled="!canStart" class="h-11 rounded-control btn-2 px-5 text-[14px] font-medium text-ink disabled:opacity-50 md:h-10">홈으로</button>
          <button v-if="showSkip" @click="emit('skip')" :disabled="!canStart" class="h-11 rounded-control btn-2 px-5 text-[14px] font-medium text-ink disabled:opacity-50 md:h-10">건너뛰기</button>
        </div>
      </div>

      <div class="flex min-h-[200px] flex-1 flex-col rounded-card border border-line bg-surface p-5">
        <label for="prep-memo" class="mb-1 text-[14px] font-semibold text-ink">분석용 메모</label>
        <p class="mb-2 text-[12px] text-muted">이 브라우저에만 임시 저장되며 서버로 전송되지 않습니다.</p>
        <textarea id="prep-memo" v-model="memo" class="w-full flex-1 resize-none rounded-control border border-control bg-surface p-3 text-[14px] leading-6 text-ink placeholder:text-faint focus-visible:border-accent" placeholder="자료를 읽으며 분석한 내용을 적어 두세요"></textarea>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';

const materialTab = ref('pdf');
const materialTabs = [{ key: 'pdf', label: '원본 PDF' }, { key: 'summary', label: '요약' }];

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
