<template>
  <article class="flex flex-col rounded-card border border-line bg-surface p-5">
    <div class="flex items-center justify-between gap-3">
      <StatusPill :label="typeLabel(scenario.type)" :tone="scenario.type === 'ROLE_PLAY' ? 'accent' : 'neutral'" />
      <span class="text-[12px] text-muted tabular-nums">{{ timeText }}</span>
    </div>
    <h3 class="mt-3 text-[16px] font-semibold leading-6 text-ink">{{ scenario.title }}</h3>
    <div class="mt-3 text-[13px] text-muted">
      <span class="text-[12px] text-faint">평가 역량</span>
      <p class="mt-0.5" :class="competencies ? 'text-ink' : 'text-faint'">{{ competencies || '–' }}</p>
    </div>
    <div class="mt-5 flex flex-1 items-end">
      <button
        type="button"
        class="h-11 rounded-control border border-control bg-surface px-4 text-[14px] font-medium text-ink hover:bg-hover md:h-10"
        :aria-label="`${scenario.title} 시작`"
        @click="emit('start', scenario)"
      >시작</button>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue';
import StatusPill from './ui/StatusPill.vue';
import { typeLabel } from '../composables/stage';

const props = defineProps({
  scenario: { type: Object, required: true },
  info: { type: Object, default: () => ({ competencies: null, prepMinutes: null }) }
});
const emit = defineEmits(['start']);

const timeText = computed(() => {
  const limit = props.scenario.timeLimitMinutes;
  if (limit == null) return '–';
  if (props.scenario.type === 'ROLE_PLAY' && props.info.prepMinutes) return `숙지 ${props.info.prepMinutes}분 + 면담 ${limit}분`;
  return `제한 ${limit}분`;
});
const competencies = computed(() => (props.info.competencies ? props.info.competencies.join(' · ') : ''));
</script>
