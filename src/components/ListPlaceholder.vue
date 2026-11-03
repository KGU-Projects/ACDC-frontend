<template>
  <!-- 불러오는 동안: 최종 배치와 같은 크기의 평평한 회색 막대(번쩍임 없음) -->
  <div v-if="variant === 'cards'" class="grid grid-cols-1 gap-3 md:grid-cols-2" aria-busy="true" aria-label="불러오는 중">
    <div v-for="i in count" :key="i" class="flex h-[214px] flex-col rounded-card border border-line bg-surface p-5">
      <div class="flex items-center justify-between"><div class="h-4 w-12 rounded-chip bg-rule"></div><div class="h-4 w-24 rounded-chip bg-rule"></div></div>
      <div class="mt-3 h-5 w-4/5 rounded-chip bg-rule"></div>
      <div class="mt-4 h-4 w-14 rounded-chip bg-rule"></div>
      <div class="mt-1.5 h-4 w-3/5 rounded-chip bg-rule"></div>
      <div class="mt-auto flex items-center justify-between border-t border-rule pt-4"><div class="h-4 w-32 rounded-chip bg-rule"></div><div class="h-9 w-16 rounded-control bg-rule"></div></div>
    </div>
  </div>
  <div v-else-if="variant === 'table'" class="overflow-hidden rounded-card border border-line bg-surface" aria-busy="true" aria-label="불러오는 중">
    <div class="h-[37px] border-b border-line"></div>
    <div v-for="i in count" :key="i" class="flex h-[61px] items-center gap-4 border-b border-rule px-4 last:border-b-0">
      <div class="h-4 flex-1 rounded-chip bg-rule"></div><div class="h-4 w-14 rounded-chip bg-rule"></div><div class="h-4 w-10 rounded-chip bg-rule"></div><div class="h-4 w-28 rounded-chip bg-rule"></div>
      <div class="w-[168px]"><div class="h-3 w-16 rounded-chip bg-rule"></div><div class="mt-2 h-1 rounded-full bg-rule"></div></div>
    </div>
  </div>
  <ul v-else class="divide-y divide-rule rounded-card border border-line bg-surface" aria-busy="true" aria-label="불러오는 중">
    <li v-for="i in count" :key="i" class="flex h-[64px] items-center justify-between gap-4 px-4 md:px-5">
      <div class="min-w-0 flex-1"><div class="h-4 w-3/4 rounded-chip bg-rule"></div><div class="mt-2 h-3 w-1/2 rounded-chip bg-rule"></div></div>
      <div class="w-[112px] sm:w-[168px]"><div class="h-3 w-16 rounded-chip bg-rule"></div><div class="mt-2 h-1 rounded-full bg-rule"></div></div>
    </li>
  </ul>
</template>

<script setup>
defineProps({
  variant: { type: String, default: 'cards' },
  count: { type: Number, default: 2 }
});
</script>
