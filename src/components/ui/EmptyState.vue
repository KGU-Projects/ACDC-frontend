<template>
  <div class="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-dash px-4 py-10 text-center">
    <p class="text-[14px] text-muted">{{ message }}</p>
    <slot name="action" />
  </div>
</template>

<script setup>
defineProps({
  message: { type: String, required: true }
});
</script>
