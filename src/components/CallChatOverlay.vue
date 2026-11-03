<template>
  <div ref="rootEl" class="flex flex-col h-full bg-slate-900/55 backdrop-blur-sm text-white" data-testid="call-chat-overlay">
    <div ref="logEl" class="flex-grow overflow-y-auto p-3 space-y-3 min-h-0">
      <div v-for="(m, i) in messages" :key="i" class="flex" :class="m.speaker === 'USER' ? 'justify-end' : 'justify-start'">
        <div class="max-w-[88%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap shadow-sm" :class="m.speaker === 'USER' ? 'bg-brand text-white rounded-br-md' : 'bg-white/90 text-slate-700 rounded-bl-md'">
          <span class="block text-[10px] font-bold opacity-70 mb-0.5">{{ m.speaker === 'USER' ? '나' : counterpartName || '상대역' }}</span>
          {{ m.text }}
        </div>
      </div>
      <p v-if="sending" class="text-xs text-white/70">상대역이 답변을 준비하고 있습니다...</p>
    </div>

    <div class="shrink-0 border-t border-white/10 bg-slate-900/60 p-3">
      <p v-if="listening" class="text-xs font-bold text-rose-300 mb-2">● 듣는 중... 말씀하세요</p>
      <p v-else-if="!speechSupported" class="text-xs text-white/60 mb-2">이 브라우저는 음성 인식을 지원하지 않습니다(Chrome 권장). 텍스트로 입력하세요.</p>
      <div class="flex items-end gap-2">
        <textarea :value="draft" @input="emit('update:draft', $event.target.value)" rows="2" :disabled="submitting" @keydown.enter.exact="onEnter" class="flex-grow min-w-0 resize-none rounded-xl bg-white/95 text-slate-800 border border-slate-200 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 p-2.5 text-sm" placeholder="발화를 입력하거나 마이크로 말한 뒤 확인·수정하세요 (Enter 전송)"></textarea>
        <div class="flex flex-col gap-1.5 shrink-0">
          <button v-if="speechSupported" @click="emit('toggle-listening')" :disabled="submitting || sending" class="w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-50" :class="listening ? 'bg-rose-500 text-white' : 'bg-white/90 text-slate-500 hover:bg-brandLight hover:text-brand'" :title="listening ? '음성 입력 중지' : '음성 입력'">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-14 0m7 7v3m-4 0h8M12 3a3 3 0 00-3 3v5a3 3 0 006 0V6a3 3 0 00-3-3z"/></svg>
          </button>
          <button @click="emit('send')" :disabled="!draft.trim() || sending || submitting" class="bg-brand hover:bg-brandHover disabled:bg-slate-400 text-white text-sm font-bold px-3 h-10 rounded-xl transition-colors">전송</button>
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
