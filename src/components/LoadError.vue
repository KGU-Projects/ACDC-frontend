<template>
  <div class="flex flex-col items-center justify-center gap-3 rounded-card border border-line bg-surface px-4 py-10 text-center" role="alert">
    <p class="text-[14px] text-muted">{{ message }}</p>
    <button
      type="button"
      class="h-11 rounded-control px-3 text-[14px] font-medium text-ink underline underline-offset-2 hover:bg-hover md:h-10"
      @click="emit('retry')"
    >다시 시도</button>
  </div>
</template>

<script setup>
defineProps({ message: { type: String, default: '목록을 불러오지 못했습니다.' } });
const emit = defineEmits(['retry']);
</script>
