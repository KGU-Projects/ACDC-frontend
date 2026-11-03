<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(17,24,39,0.4)] p-0 sm:items-center sm:p-4"
      @mousedown.self="emit('close')"
    >
      <div
        ref="panel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
        class="flex max-h-[90vh] w-full flex-col rounded-t-card bg-surface sm:max-w-md sm:rounded-card modal-panel"
        @keydown="onKeydown"
      >
        <div class="flex items-center justify-between gap-3 border-b border-rule px-5 py-4">
          <h2 :id="titleId" class="text-[16px] font-semibold text-ink">{{ title }}</h2>
          <button
            type="button"
            class="-mr-2 flex h-9 w-9 items-center justify-center rounded-control text-muted hover:bg-ground hover:text-ink"
            aria-label="닫기"
            @click="emit('close')"
          >
            <AppIcon name="close" :size="16" />
          </button>
        </div>
        <div class="overflow-y-auto px-5 py-4 text-[14px] text-ink">
          <slot />
        </div>
        <div v-if="$slots.footer" class="flex flex-wrap justify-end gap-2 border-t border-rule px-5 py-4">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import AppIcon from './AppIcon.vue';

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' }
});
const emit = defineEmits(['close']);

const panel = ref(null);
const titleId = `modal-title-${Math.random().toString(36).slice(2, 8)}`;
let previouslyFocused = null;

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const onKeydown = (e) => {
  if (e.key === 'Escape') {
    e.stopPropagation();
    emit('close');
    return;
  }
  if (e.key !== 'Tab' || !panel.value) return;
  const items = [...panel.value.querySelectorAll(FOCUSABLE)];
  if (!items.length) {
    e.preventDefault();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.value)) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
};

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      previouslyFocused = document.activeElement;
      document.body.style.overflow = 'hidden';
      await nextTick();
      const target = panel.value?.querySelector(FOCUSABLE);
      (target || panel.value)?.focus();
    } else {
      document.body.style.overflow = '';
      previouslyFocused?.focus?.();
      previouslyFocused = null;
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  if (props.open) {
    document.body.style.overflow = '';
    previouslyFocused?.focus?.();
  }
});
</script>

<style scoped>
.modal-panel {
  box-shadow: 0 8px 24px rgba(17, 24, 39, 0.12);
  outline: none;
}
</style>
