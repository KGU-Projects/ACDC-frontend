<template>
  <ul class="divide-y divide-rule rounded-card border border-line bg-surface">
    <li v-for="s in sessions" :key="s.id">
      <component
        :is="clickable(s) ? 'button' : 'div'"
        :type="clickable(s) ? 'button' : undefined"
        class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        :class="clickable(s) ? 'hover:bg-hover' : ''"
        @click="clickable(s) && emit('open', s)"
      >
        <span class="min-w-0">
          <span class="block truncate text-[14px] font-medium text-ink">{{ s.scenarioTitle }}</span>
          <span class="mt-0.5 block text-[12px] text-muted tabular-nums">{{ typeLabel(s.scenarioType) }} · {{ modeLabel(s.mode) }} · {{ formatDate(s.createdAt) || '–' }}</span>
        </span>
        <StatusPill :label="stageLabel(s.stage)" :tone="stageTone(s.stage)" class="shrink-0" />
      </component>
    </li>
  </ul>
</template>

<script setup>
import StatusPill from './ui/StatusPill.vue';
import { canOpenResult, formatDate, modeLabel, stageLabel, stageTone, typeLabel } from '../composables/stage';

defineProps({ sessions: { type: Array, required: true } });
const emit = defineEmits(['open']);

const clickable = (s) => s.stage === 'IN_PROGRESS' || canOpenResult(s.stage);
</script>
