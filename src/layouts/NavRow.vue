<template>
  <RouterLink
    :to="item.to"
    class="flex items-center gap-2.5 rounded-control px-3 text-[14px]"
    :class="[
      mobile ? 'h-11' : 'h-9',
      active ? 'bg-line font-medium text-ink' : 'text-muted hover:bg-line hover:text-ink'
    ]"
    :aria-current="active ? 'page' : undefined"
  >
    <AppIcon :name="item.icon" :size="16" :class="active ? 'text-accent' : ''" />
    <span class="flex-1">{{ item.label }}</span>
    <span
      v-if="badge"
      class="min-w-[20px] rounded-chip bg-surface px-1.5 text-center text-[12px] font-medium leading-5 text-ink tabular-nums"
      :aria-label="`진행 중 ${badge}건`"
    >{{ badge }}</span>
  </RouterLink>
</template>

<script setup>
import AppIcon from '../components/ui/AppIcon.vue';

defineProps({
  item: { type: Object, required: true },
  active: { type: Boolean, default: false },
  badge: { type: Number, default: 0 },
  mobile: { type: Boolean, default: false }
});
</script>
