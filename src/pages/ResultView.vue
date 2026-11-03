<template>
  <div>
    <PageHeader
      :title="session?.scenarioTitle || '결과'"
      :breadcrumb="[{ label: '역량 분석 결과', to: '/results' }, { label: session?.scenarioTitle || '결과' }]"
      :subtitle="session ? `${typeLabel(session.scenarioType)} · ${modeLabel(session.mode)}${session.startedAt ? ' · ' + formatDate(session.startedAt) : ''}` : ''"
    />

    <div v-if="errorMessage" class="rounded-card border border-line bg-surface px-4 py-10 text-center" role="alert">
      <p class="text-[14px] text-negative">{{ errorMessage }}</p>
      <RouterLink to="/results" class="mt-3 inline-block text-[14px] font-medium text-ink underline underline-offset-2">역량 분석 결과로 돌아가기</RouterLink>
    </div>
    <div v-else-if="!session" class="space-y-3" aria-hidden="true">
      <div class="h-40 rounded-card bg-rule"></div>
      <div class="h-40 rounded-card bg-rule"></div>
    </div>

    <template v-else>
      <!-- 점수는 RESULT_READY일 때만 렌더한다. 그 외 단계는 라벨과 안내문만 보인다. -->
      <div v-if="session.stage !== 'RESULT_READY'" class="rounded-card border border-line bg-surface px-5 py-8">
        <StatusPill :label="stageLabel" :tone="session.stage === 'FAILED' || session.stage === 'ABORTED' ? 'negative' : 'warning'" />
        <p class="mt-3 text-[14px] leading-6 text-muted">{{ stageMessage }}</p>
        <RouterLink to="/records" class="mt-4 inline-block text-[14px] font-medium text-ink underline underline-offset-2">나의 응시 내역 보기</RouterLink>
      </div>

      <div v-else-if="!session.evaluations?.length" class="rounded-card border border-line bg-surface px-5 py-8 text-[14px] text-muted">
        채점 결과가 없습니다.
      </div>

      <div v-else class="space-y-4">
        <article v-for="e in session.evaluations" :key="e.competency" class="rounded-card border border-line bg-surface p-5">
          <div class="flex items-start justify-between gap-4">
            <h2 class="min-w-0 text-[16px] font-semibold leading-6 text-ink">{{ e.competency }}</h2>
            <div class="shrink-0 text-right">
              <p class="text-ink tabular-nums"><span class="text-[24px] font-semibold leading-8">{{ scoreOf(e) }}</span><span class="text-[14px] text-muted"> / 5</span></p>
              <p v-if="e.finalScore != null && e.finalScore !== e.aiScore" class="text-[12px] text-muted tabular-nums">AI 점수 {{ e.aiScore }} → FT 확정</p>
            </div>
          </div>
          <div class="mt-3 flex gap-[2px]" role="img" :aria-label="`5점 만점에 ${scoreOf(e)}점`">
            <span v-for="n in 5" :key="n" class="h-2 flex-1 rounded-[2px]" :class="n <= segmentsOf(e) ? 'bg-accent' : 'bg-rule'"></span>
          </div>

          <div v-if="e.aiEvidence?.length" class="mt-5">
            <h3 class="mb-1.5 text-[13px] font-semibold text-ink">근거</h3>
            <ul class="space-y-1.5">
              <li v-for="(ev, i) in e.aiEvidence" :key="i" class="whitespace-pre-wrap rounded-control bg-ground px-3 py-2 text-[14px] leading-6 text-muted">“{{ ev }}”</li>
            </ul>
          </div>

          <div class="mt-5">
            <h3 class="mb-1.5 text-[13px] font-semibold text-ink">피드백</h3>
            <p class="whitespace-pre-wrap text-[14px] leading-6 text-ink">{{ e.aiFeedback }}</p>
          </div>

          <div v-if="e.ftComment" class="mt-5 border-t border-rule pt-4">
            <h3 class="mb-1.5 text-[13px] font-semibold text-ink">FT 코멘트</h3>
            <p class="whitespace-pre-wrap text-[14px] leading-6 text-ink">{{ e.ftComment }}</p>
          </div>
        </article>
      </div>

      <section v-if="session.scenarioType === 'ROLE_PLAY' && session.turns?.length" class="mt-8">
        <h2 class="mb-3 text-[16px] font-semibold text-ink">대화 기록</h2>
        <ul class="space-y-3 rounded-card border border-line bg-surface p-4 sm:p-5">
          <li v-for="t in session.turns" :key="t.seq" class="flex flex-col" :class="t.speaker === 'USER' ? 'items-end' : 'items-start'">
            <span class="mb-1 text-[12px] text-muted">{{ t.speaker === 'USER' ? '나' : '상대역' }}</span>
            <p class="max-w-[85%] whitespace-pre-wrap rounded-card px-3 py-2 text-[14px] leading-6" :class="t.speaker === 'USER' ? 'bg-primary text-white' : 'bg-rule text-ink'">{{ t.text }}</p>
          </li>
        </ul>
      </section>

      <section v-else-if="session.scenarioType === 'IN_BASKET' && session.answer" class="mt-8">
        <h2 class="mb-3 text-[16px] font-semibold text-ink">제출한 답안</h2>
        <p class="whitespace-pre-wrap rounded-card border border-line bg-surface p-4 text-[14px] leading-6 text-ink sm:p-5">{{ session.answer }}</p>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getSession } from '../api/acdc';
import { STAGE_LABELS, formatDate, modeLabel, typeLabel } from '../composables/stage';
import PageHeader from '../components/ui/PageHeader.vue';
import StatusPill from '../components/ui/StatusPill.vue';

const route = useRoute();
const router = useRouter();

const session = ref(null);
const errorMessage = ref('');

const STAGE_MESSAGES = {
  RESULT_PENDING: '결과는 공개 시각에 확인할 수 있습니다',
  FAILED: '채점에 실패했습니다. 담당 FT에게 문의해 주세요',
  ABORTED: '제한 시간 안에 제출되지 않아 중단되었습니다'
};
const stageLabel = computed(() => STAGE_LABELS[session.value?.stage] || session.value?.stage || '');
const stageMessage = computed(() => STAGE_MESSAGES[session.value?.stage] || '채점이 진행 중입니다. 잠시 후 다시 확인해 주세요.');

// 최종 점수가 있으면 그것, 없으면 AI 점수. 막대는 1~5칸으로 제한한다.
const scoreOf = (e) => e.finalScore ?? e.aiScore;
const segmentsOf = (e) => Math.max(0, Math.min(5, Math.round(Number(scoreOf(e)) || 0)));

onMounted(async () => {
  try {
    session.value = await getSession(route.params.id);
  } catch (error) {
    errorMessage.value = error.message || '결과를 불러오지 못했습니다.';
  }
});
</script>
