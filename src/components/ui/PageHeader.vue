<template>
  <header class="mb-6">
    <nav v-if="breadcrumb && breadcrumb.length" aria-label="현재 위치" class="mb-2 flex flex-wrap items-center gap-1 text-[12px] text-muted">
      <template v-for="(crumb, i) in breadcrumb" :key="i">
        <AppIcon v-if="i > 0" name="chevron-right" :size="12" class="text-faint" />
        <RouterLink v-if="crumb.to && i < breadcrumb.length - 1" :to="crumb.to" class="hover:text-ink hover:underline">{{ crumb.label }}</RouterLink>
        <span v-else :aria-current="i === breadcrumb.length - 1 ? 'page' : undefined">{{ crumb.label }}</span>
      </template>
    </nav>
    <div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div class="min-w-0">
        <h1 class="text-[24px] font-semibold leading-8 tracking-[-0.02em] text-ink">{{ title }}</h1>
        <p v-if="subtitle" class="mt-1 text-[14px] text-muted">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="flex shrink-0 items-center gap-2">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>

<script setup>
import AppIcon from './AppIcon.vue';

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  breadcrumb: { type: Array, default: () => [] }
});
</script>
