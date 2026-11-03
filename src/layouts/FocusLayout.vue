<template>
  <div class="min-h-screen bg-ground">
    <header class="sticky top-0 z-30 flex h-12 items-center gap-4 border-b border-line bg-surface px-4">
      <RouterLink to="/home" aria-label="평가 홈으로" class="shrink-0"><BrandMark size="sm" /></RouterLink>
      <div class="min-w-0 flex-1 truncate text-[14px] font-medium text-ink">
        <slot name="title" />
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <slot name="right" />
      </div>
    </header>
    <main>
      <slot />
    </main>
  </div>
</template>

<script setup>
import BrandMark from '../components/ui/BrandMark.vue';
</script>
