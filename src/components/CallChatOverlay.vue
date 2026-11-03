<template>
  <div ref="rootEl" class="flex h-full flex-col bg-[#0d1117]/80 text-white" data-testid="call-chat-overlay">
    <div ref="logEl" class="min-h-0 flex-grow space-y-3 overflow-y-auto p-3">
      <div v-for="(m, i) in messages" :key="i" class="flex" :class="m.speaker === 'USER' ? 'justify-end' : 'justify-start'">
        <div class="max-w-[88%] whitespace-pre-wrap rounded-card px-3 py-2 text-[14px] leading-5" :class="m.speaker === 'USER' ? 'bg-[#e8edf3] text-ink' : 'border border-white/20 bg-white/10 text-white'">
          <span class="mb-0.5 block text-[12px]" :class="m.speaker === 'USER' ? 'text-muted' : 'text-white/75'">{{ m.speaker === 'USER' ? '나' : counterpartName || '상대역' }}</span>
          {{ m.text }}
        </div>
      </div>
      <p v-if="sending" class="text-[12px] text-white/75" aria-live="polite">상대역이 답변을 준비하고 있습니다...</p>
    </div>

    <div class="shrink-0 border-t border-white/15 bg-[#0d1117]/60 p-3">
      <p v-if="listening" class="mb-2 text-[12px] text-[#ff9a8f]" aria-live="polite">듣는 중... 말씀하세요</p>
      <p v-else-if="!speechSupported" class="mb-2 text-[12px] text-white/75">이 브라우저는 음성 인식을 지원하지 않습니다(Chrome 권장). 텍스트로 입력하세요.</p>
      <div class="flex items-end gap-2">
        <textarea :value="draft" @input="emit('update:draft', $event.target.value)" rows="2" :disabled="submitting" aria-label="발화 입력" @keydown.enter.exact="onEnter" class="min-w-0 flex-grow resize-none rounded-control border border-control bg-white p-2.5 text-[14px] text-ink placeholder:text-faint focus-visible:outline-white" placeholder="발화를 입력하거나 마이크로 말한 뒤 확인·수정하세요 (Enter 전송)"></textarea>
        <div class="flex shrink-0 flex-col gap-1.5">
          <button v-if="speechSupported" @click="emit('toggle-listening')" :disabled="submitting || sending" class="flex h-11 w-11 items-center justify-center rounded-control border disabled:opacity-50 md:h-10 md:w-10" :class="listening ? 'border-negative bg-negative text-white' : 'border-white/40 text-white hover:bg-white/10'" :title="listening ? '음성 입력 중지' : '음성 입력'" :aria-label="listening ? '음성 입력 중지' : '음성 입력'" :aria-pressed="listening">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11a7 7 0 01-14 0m7 7v3m-4 0h8M12 3a3 3 0 00-3 3v5a3 3 0 006 0V6a3 3 0 00-3-3z"/></svg>
          </button>
          <button @click="emit('send')" :disabled="!draft.trim() || sending || submitting" class="h-11 rounded-control border border-white/60 px-3 text-[14px] font-medium text-white hover:bg-white/10 disabled:opacity-50 md:h-10">전송</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps({
  messages: { type: Array, required: true },
  draft: { type: String, default: '' },
  sending: { type: Boolean, default: false },
  listening: { type: Boolean, default: false },
  speechSupported: { type: Boolean, default: false },
  submitting: { type: Boolean, default: false },
  counterpartName: { type: String, default: '' },
});
const emit = defineEmits(['update:draft', 'send', 'toggle-listening']);

const logEl = ref(null);
const rootEl = ref(null);

// 한글 조합 중(isComposing, keyCode 229)의 Enter는 마지막 글자 확정용이므로 전송하지 않는다.
const onEnter = (event) => {
  if (event.isComposing || event.keyCode === 229) return;
  event.preventDefault();
  emit('send');
};

const scrollToEnd = async () => {
  await nextTick();
  if (logEl.value) logEl.value.scrollTop = logEl.value.scrollHeight;
};

// 새 메시지가 쌓이거나 상대역이 입력 중 표시가 바뀌면 맨 아래로 스크롤한다.
watch(() => [props.messages.length, props.sending], scrollToEnd, { flush: 'post' });

// 좁은 화면에서 접었다 다시 펼치면(부모가 숨겼다 보임) 맨 아래로 이동한다.
let observer = null;
onMounted(() => {
  if (typeof IntersectionObserver === 'undefined' || !rootEl.value) return;
  observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) scrollToEnd();
  });
  observer.observe(rootEl.value);
});
onBeforeUnmount(() => observer?.disconnect());
</script>
