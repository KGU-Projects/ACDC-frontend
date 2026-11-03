<template>
  <ul class="divide-y divide-rule rounded-card border border-line bg-surface">
    <li v-for="s in sessions" :key="s.id">
      <component
        :is="clickable(s) ? 'button' : 'div'"
        :type="clickable(s) ? 'button' : undefined"
        class="flex min-h-[64px] w-full items-center gap-4 px-4 py-3 text-left md:px-5"
        :class="clickable(s) ? 'hover:bg-hover' : ''"
        @click="clickable(s) && emit('open', s)"
      >
        <span class="min-w-0 flex-1">
          <span class="block truncate text-[14px] font-medium text-ink">{{ s.scenarioTitle }}</span>
          <span class="mt-0.5 block text-[12px] text-muted tabular-nums">{{ typeLabel(s.scenarioType) }} · {{ modeLabel(s.mode) }} · {{ formatDate(s.createdAt) || '–' }}</span>
        </span>
        <!-- 단계 이름과 진행 트랙(점수 없음). 한 줄에 상태 표시는 이것 하나다. -->
        <span class="flex w-[112px] shrink-0 flex-col gap-1.5 sm:w-[168px]">
          <span class="truncate text-[12px] font-medium leading-4" :class="stageInk(s.stage)">{{ stageLabel(s.stage) }}</span>
          <StageTrack :stage="s.stage" :mode="s.mode" />
        </span>
        <AppIcon name="chevron-right" :size="16" class="hidden text-faint sm:block" :class="clickable(s) ? '' : 'invisible'" />
      </component>
    </li>
  </ul>
</template>

<script setup>
import AppIcon from './ui/AppIcon.vue';
import StageTrack from './ui/StageTrack.vue';
import { canOpenResult, formatDate, modeLabel, stageLabel, typeLabel } from '../composables/stage';

defineProps({ sessions: { type: Array, required: true } });
const emit = defineEmits(['open']);

const clickable = (s) => s.stage === 'IN_PROGRESS' || canOpenResult(s.stage);
const stageInk = (stage) => (stage === 'FAILED' || stage === 'ABORTED' ? 'text-negative' : 'text-ink');
</script>
