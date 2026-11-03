<template>
  <span class="inline-flex items-center" :class="s.gap">
    <svg :width="s.icon" :height="s.icon" viewBox="0 0 32 32" fill="none" aria-hidden="true" class="shrink-0">
      <path d="M4 28 L13 6 L22 28" stroke="var(--primary)" stroke-width="3.6" stroke-linejoin="miter" stroke-linecap="butt" />
      <path d="M8 21 H18" stroke="var(--primary)" stroke-width="3.2" />
      <path d="M16.5 14 L28 3.5 M20.5 3.5 H28 V11" stroke="var(--accent)" stroke-width="2.8" stroke-linecap="square" stroke-linejoin="miter" />
    </svg>
    <span class="inline-flex flex-col leading-none">
      <span class="font-bold tracking-[-0.03em] text-ink" :class="s.word">AC/DC</span>
      <span class="text-muted" :class="s.sub">역량평가 포털</span>
    </span>
  </span>
</template>

<script setup>
import { computed } from 'vue';

// size: sm(시험 상단 바·모바일), md(앱 상단 바), lg(로그인·가입)
const props = defineProps({
  size: { type: String, default: 'md', validator: (v) => ['sm', 'md', 'lg'].includes(v) }
});
const SIZES = {
  sm: { icon: 24, gap: 'gap-1.5', word: 'text-[16px]', sub: 'mt-0.5 text-[12px]' },
  md: { icon: 40, gap: 'gap-2.5', word: 'text-[22px]', sub: 'mt-1 text-[12px]' },
  lg: { icon: 60, gap: 'gap-3.5', word: 'text-[32px]', sub: 'mt-1.5 text-[14px]' }
};
const s = computed(() => SIZES[props.size]);
</script>
