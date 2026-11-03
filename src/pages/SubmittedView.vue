<template>
  <div class="flex min-h-[70vh] items-center justify-center bg-ground px-4 py-10">
    <div class="w-full max-w-[440px] rounded-card border border-line bg-surface p-6 sm:p-8">
      <span class="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--pill-accent-bg)] text-accent">
        <AppIcon name="check" :size="20" />
      </span>
      <h1 class="mt-4 text-[24px] font-semibold leading-8 text-ink">제출이 완료되었습니다</h1>
      <p class="mt-2 text-[14px] leading-6 text-muted">채점 결과는 나의 응시 내역에서 단계별로 확인할 수 있습니다.</p>
      <div class="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <RouterLink to="/records" class="flex h-11 items-center justify-center rounded-control bg-primary px-5 text-[14px] font-medium text-white hover:bg-primaryHover md:h-10">나의 응시 내역 보기</RouterLink>
        <RouterLink to="/home" class="flex h-11 items-center justify-center rounded-control px-4 text-[14px] font-medium text-ink underline underline-offset-2 hover:bg-ground md:h-10">평가 홈으로</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import AppIcon from '../components/ui/AppIcon.vue';
</script>
