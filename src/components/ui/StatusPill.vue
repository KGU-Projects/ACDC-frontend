<template>
  <span class="status-pill" :class="`status-pill--${tone}`">{{ label }}</span>
</template>

<script setup>
defineProps({
  tone: { type: String, default: 'neutral', validator: (v) => ['neutral', 'accent', 'positive', 'negative', 'warning'].includes(v) },
  label: { type: String, required: true }
});
</script>

<style scoped>
.status-pill {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
}
.status-pill--neutral { background: var(--pill-neutral-bg); color: var(--pill-neutral-fg); }
.status-pill--accent { background: var(--pill-accent-bg); color: var(--pill-accent-fg); }
.status-pill--positive { background: var(--pill-positive-bg); color: var(--pill-positive-fg); }
.status-pill--negative { background: var(--pill-negative-bg); color: var(--pill-negative-fg); }
.status-pill--warning { background: var(--pill-warning-bg); color: var(--pill-warning-fg); }
</style>
