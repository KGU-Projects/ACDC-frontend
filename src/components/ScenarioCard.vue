<template>
  <article class="flex flex-col rounded-card border border-line bg-surface p-5">
    <div class="flex items-center justify-between gap-3 text-[13px]">
      <span class="font-medium text-ink">{{ typeLabel(scenario.type) }}</span>
      <span class="text-muted tabular-nums">{{ timeText }}</span>
    </div>
    <h3 class="mt-2 text-[16px] font-semibold leading-6 text-ink">{{ scenario.title }}</h3>
    <dl class="mb-5 mt-3 text-[13px] leading-5">
      <dt class="text-muted">평가 역량</dt>
      <dd class="mt-0.5" :class="competencies ? 'text-ink' : 'text-faint'">{{ competencies || '–' }}</dd>
    </dl>
    <div class="mt-auto flex items-center justify-between gap-3 border-t border-rule pt-4">
      <p class="min-w-0 text-[13px] leading-5 text-muted tabular-nums">
        <span class="sr-only">내 응시 기록: </span>연습 {{ history.practice }}회 · {{ history.real ? '실전 응시함' : '실전 미응시' }}
      </p>
      <button
        type="button"
        class="btn-2 h-11 shrink-0 px-4 text-[14px] md:h-9"
        :aria-label="`${scenario.title} 시작`"
        @click="emit('start', scenario)"
      >시작</button>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue';
import { typeLabel } from '../composables/stage';

const props = defineProps({
  scenario: { type: Object, required: true },
  info: { type: Object, default: () => ({ competencies: null, prepMinutes: null }) },
  sessions: { type: Array, default: () => [] }
});

// 표시 전용: 이 과제의 내 세션 수(연습 횟수, 실전 응시 여부)를 세션 목록에서 센다.
const history = computed(() => {
  const mine = props.sessions.filter((s) => s.scenarioId === props.scenario.id);
  return { practice: mine.filter((s) => s.mode !== 'REAL').length, real: mine.some((s) => s.mode === 'REAL') };
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
