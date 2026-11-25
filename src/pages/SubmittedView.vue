<template>
  <div class="flex min-h-[70vh] items-center justify-center bg-ground px-4 py-10">
    <div class="w-full max-w-[440px] rounded-card border border-line bg-surface p-6 sm:p-8">
      <AppIcon name="check" :size="24" class="text-positive" />
      <h1 class="mt-4 text-[24px] font-semibold leading-8 tracking-[-0.02em] text-ink">제출이 완료되었습니다</h1>
      <p class="mt-2 text-[14px] leading-6 text-muted">채점 결과는 나의 응시 내역에서 단계별로 확인할 수 있습니다.</p>
      <p v-if="recording" class="mt-2 text-[13px]" :class="recording.tone === 'negative' ? 'text-negative' : 'text-muted'" role="status">{{ recording.text }}</p>
      <div class="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <RouterLink to="/records" class="flex h-11 items-center justify-center rounded-control bg-primary px-5 text-[14px] font-medium text-white hover:bg-primaryHover md:h-10">나의 응시 내역 보기</RouterLink>
        <RouterLink to="/home" class="flex h-11 items-center justify-center rounded-control px-4 text-[14px] font-medium text-ink underline underline-offset-2 hover:bg-hover md:h-10">평가 홈으로</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import AppIcon from '../components/ui/AppIcon.vue';
import { getSession } from '../api/acdc';
import { recordingNotice } from '../composables/stage';

// 면담 영상 분석 상태를 안내한다. 세션 id가 없거나 조회에 실패하면 안내만 생략한다.
const route = useRoute();
const status = ref(null);
const recording = computed(() => recordingNotice(status.value));

onMounted(async () => {
  const id = route.query.session;
  if (!id) return;
  try {
    status.value = (await getSession(id)).recordingStatus ?? null;
  } catch {
    // 안내를 못 보여줄 뿐 제출 완료 화면에는 영향이 없다
  }
});
</script>
