<template>
  <!-- 세션이 응시에서 결과 공개까지 어디쯤 와 있는지. 점수는 다루지 않고 단계만 보여 준다. -->
  <div class="w-full">
    <span class="sr-only">{{ srText }}</span>
    <div class="flex gap-[3px]" aria-hidden="true">
      <span
        v-for="(step, i) in steps"
        :key="step"
        class="flex-1 rounded-full"
        :class="[size === 'full' ? 'h-1.5' : 'h-1', segClass(i)]"
      ></span>
    </div>
    <div v-if="size === 'full'" class="mt-2 flex gap-[3px] text-[12px] leading-4" aria-hidden="true">
      <span
        v-for="(step, i) in steps"
        :key="step"
        class="min-w-0 flex-1 truncate"
        :class="i === current && !preview ? (broken ? 'font-medium text-negative' : 'font-medium text-ink') : 'text-muted'"
      >{{ step }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

// 표시 전용. stage가 없으면(preview) 모든 칸을 회색으로 두고 단계 이름만 보인다(이용 안내).
const props = defineProps({
  stage: { type: String, default: '' },
  mode: { type: String, default: 'PRACTICE' },
  size: { type: String, default: 'row', validator: (v) => ['row', 'full'].includes(v) },
  preview: { type: Boolean, default: false }
});

const PRACTICE_STEPS = ['응시', 'AI 채점', '결과'];
const REAL_STEPS = ['응시', 'AI 채점', 'FT 검토', '공개 대기', '결과'];

const steps = computed(() =>
  props.mode === 'REAL' || props.stage === 'FT_REVIEW' || props.stage === 'RESULT_PENDING' ? REAL_STEPS : PRACTICE_STEPS
);

const current = computed(() => {
  const last = steps.value.length - 1;
  switch (props.stage) {
    case 'IN_PROGRESS':
    case 'ABORTED':
      return 0;
    case 'WAITING':
    case 'AI_SCORING':
    case 'FAILED':
      return 1;
    case 'FT_REVIEW':
      return 2;
    case 'RESULT_PENDING':
      return 3;
    case 'RESULT_READY':
      return last;
    default:
      return -1;
  }
});

const broken = computed(() => props.stage === 'FAILED' || props.stage === 'ABORTED');

const segClass = (i) => {
  if (props.preview || current.value < 0) return 'bg-track';
  if (i < current.value) return 'bg-accent';
  if (i === current.value) return broken.value ? 'bg-negative' : 'bg-accent';
  return 'bg-track';
};

const srText = computed(() => {
  if (props.preview || current.value < 0) return `진행 단계: ${steps.value.join(', ')}`;
  return `진행 단계 ${steps.value.length}단계 중 ${current.value + 1}단계, ${steps.value[current.value]}${broken.value ? '에서 멈춤' : ''}`;
});
</script>
