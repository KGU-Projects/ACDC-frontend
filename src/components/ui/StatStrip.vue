<template>
  <div
    class="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line md:[grid-template-columns:repeat(var(--n),minmax(0,1fr))]"
    :style="{ '--n': items.length }"
  >
    <div
      v-for="(item, i) in items"
      :key="item.label"
      class="bg-surface px-4 py-4 md:px-5"
      :class="items.length % 2 === 1 && i === items.length - 1 ? 'col-span-2 md:col-span-1' : ''"
    >
      <div class="text-[12px] text-muted">{{ item.label }}</div>
      <div class="mt-1 text-[28px] font-semibold leading-9 tabular-nums"
           :class="item.value === '–' ? 'text-faint' : item.accent ? 'text-accent' : 'text-ink'">
        {{ item.value }}<span v-if="item.suffix" class="ml-1 text-[14px] font-normal text-muted">{{ item.suffix }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  items: { type: Array, required: true }
});
</script>
