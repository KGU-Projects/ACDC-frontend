<template>
  <div>
    <PageHeader
      :title="session?.scenarioTitle || '결과'"
      :breadcrumb="[{ label: '역량 분석 결과', to: '/results' }, { label: session?.scenarioTitle || '결과' }]"
      :subtitle="session ? `${typeLabel(session.scenarioType)} · ${modeLabel(session.mode)}${session.startedAt ? ' · ' + formatDate(session.startedAt) : ''}` : ''"
    />

    <div v-if="errorMessage" class="rounded-card border border-line bg-surface px-5 py-8" role="alert">
      <p class="text-[14px] text-negative">{{ errorMessage }}</p>
      <RouterLink to="/results" class="mt-3 inline-flex min-h-11 items-center text-[14px] font-medium text-ink underline underline-offset-2 md:min-h-0">역량 분석 결과로 돌아가기</RouterLink>
    </div>
    <div v-else-if="!session" class="space-y-3" aria-busy="true" aria-label="불러오는 중">
      <div class="rounded-card border border-line bg-surface p-5 md:p-6">
        <div class="h-5 w-24 rounded-chip bg-rule"></div>
        <div v-for="i in 2" :key="i" class="mt-6 flex items-center gap-6"><div class="h-4 w-40 rounded-chip bg-rule"></div><div class="h-2 max-w-[360px] flex-1 rounded-chip bg-rule"></div><div class="ml-auto h-7 w-14 rounded-chip bg-rule"></div></div>
      </div>
    </div>

    <template v-else>
      <!-- 점수는 RESULT_READY일 때만 렌더한다. 그 외 단계는 단계 트랙과 안내문만 보인다. -->
      <section v-if="session.stage !== 'RESULT_READY'" class="rounded-card border border-line bg-surface p-5 md:p-6" aria-labelledby="result-progress">
        <h2 id="result-progress" class="text-[16px] font-semibold text-ink">진행 상황</h2>
        <p class="mt-1 text-[14px] font-medium" :class="session.stage === 'FAILED' || session.stage === 'ABORTED' ? 'text-negative' : 'text-ink'">{{ stageLabel }}</p>
        <div class="mt-4 max-w-[560px]"><StageTrack :stage="session.stage" :mode="session.mode" size="full" /></div>
        <p class="mt-5 text-[14px] leading-6 text-muted">{{ stageMessage }}</p>
        <RouterLink to="/records" class="mt-3 inline-flex min-h-11 items-center text-[14px] font-medium text-ink underline underline-offset-2 md:min-h-0">나의 응시 내역 보기</RouterLink>
      </section>

      <div v-else-if="!session.evaluations?.length" class="rounded-card border border-dashed border-dash px-5 py-8 text-[14px] text-muted">
        채점 결과가 없습니다.
      </div>

      <template v-else>
        <!-- 이 화면의 질문 "역량별로 몇 점인가"에 답하는 가장 큰 블록: 역량별 5점 척도 -->
        <section class="rounded-card border border-line bg-surface" aria-labelledby="result-scores">
          <div class="flex items-baseline justify-between gap-3 px-5 pb-2 pt-5 md:px-6">
            <h2 id="result-scores" class="text-[16px] font-semibold text-ink">역량별 점수</h2>
            <span class="text-[12px] text-muted tabular-nums">{{ session.evaluations.length }}개 역량 · 5점 척도</span>
          </div>
          <ul class="divide-y divide-rule">
            <li v-for="e in session.evaluations" :key="e.competency" class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-2 px-5 py-4 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)_96px] md:px-6">
              <a :href="`#comp-${slug(e.competency)}`" class="min-w-0 truncate text-[14px] font-medium text-ink hover:underline">{{ e.competency }}</a>
              <div class="order-last col-span-2 flex max-w-[360px] gap-[3px] md:order-none md:col-span-1" role="img" :aria-label="`5점 만점에 ${scoreOf(e)}점`">
                <span v-for="n in 5" :key="n" class="h-2 flex-1 rounded-[2px]" :class="n <= segmentsOf(e) ? 'bg-accent' : 'bg-track'"></span>
              </div>
              <div class="text-right tabular-nums">
                <p class="text-ink"><span class="text-[24px] font-normal leading-8 tracking-[-0.02em]">{{ scoreOf(e) }}</span><span class="text-[13px] text-muted"> / 5</span></p>
                <p v-if="e.finalScore != null && e.finalScore !== e.aiScore" class="text-[12px] text-muted">AI {{ e.aiScore }} → FT 확정</p>
                <p v-else-if="e.finalScore != null" class="text-[12px] text-muted">FT 확정</p>
              </div>
            </li>
          </ul>
        </section>

        <h2 class="mb-3 mt-8 text-[16px] font-semibold text-ink">역량별 피드백</h2>
        <div class="space-y-3">
          <article v-for="e in session.evaluations" :id="`comp-${slug(e.competency)}`" :key="e.competency" class="scroll-mt-24 rounded-card border border-line bg-surface p-5 md:p-6">
            <h3 class="text-[15px] font-semibold leading-6 text-ink">{{ e.competency }}</h3>

            <div class="mt-3 grid gap-5" :class="e.aiEvidence?.length ? 'lg:grid-cols-2' : ''">
              <div>
                <h4 class="mb-1.5 text-[13px] font-medium text-muted">피드백</h4>
                <p class="whitespace-pre-wrap text-[14px] leading-6 text-ink">{{ e.aiFeedback }}</p>
              </div>
              <div v-if="e.aiEvidence?.length">
                <h4 class="mb-1.5 text-[13px] font-medium text-muted">근거가 된 발언·답안</h4>
                <ul class="space-y-1.5">
                  <li v-for="(ev, i) in e.aiEvidence" :key="i" class="whitespace-pre-wrap rounded-control bg-ground px-3 py-2 text-[14px] leading-6 text-ink">“{{ ev }}”</li>
                </ul>
              </div>
            </div>

            <div v-if="e.ftComment" class="mt-5 border-t border-rule pt-4">
              <h4 class="mb-1.5 text-[13px] font-medium text-muted">FT 코멘트</h4>
              <p class="whitespace-pre-wrap text-[14px] leading-6 text-ink">{{ e.ftComment }}</p>
            </div>
          </article>
        </div>
      </template>

      <section v-if="session.scenarioType === 'ROLE_PLAY' && session.turns?.length" class="mt-8">
        <h2 class="mb-3 text-[16px] font-semibold text-ink">대화 기록</h2>
        <ul class="space-y-3 rounded-card border border-line bg-surface p-4 sm:p-5">
          <li v-for="t in session.turns" :key="t.seq" class="flex flex-col" :class="t.speaker === 'USER' ? 'items-end' : 'items-start'">
            <span class="mb-1 text-[12px] text-muted">{{ t.speaker === 'USER' ? '나' : '상대역' }}</span>
            <p class="max-w-[85%] whitespace-pre-wrap rounded-card px-3 py-2 text-[14px] leading-6" :class="t.speaker === 'USER' ? 'bg-active text-ink' : 'bg-ground text-ink'">{{ t.text }}</p>
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
import { useRoute } from 'vue-router';
import { getSession } from '../api/acdc';
import { STAGE_LABELS, formatDate, modeLabel, typeLabel } from '../composables/stage';
import PageHeader from '../components/ui/PageHeader.vue';
import StageTrack from '../components/ui/StageTrack.vue';

const route = useRoute();

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
// 역량 이름으로 같은 화면 안의 피드백 카드로 이동하는 앵커 id를 만든다(표시 전용).
const slug = (name) => encodeURIComponent(String(name)).replace(/%/g, '');
const segmentsOf = (e) => Math.max(0, Math.min(5, Math.round(Number(scoreOf(e)) || 0)));

onMounted(async () => {
  try {
    session.value = await getSession(route.params.id);
  } catch (error) {
    errorMessage.value = error.message || '결과를 불러오지 못했습니다.';
  }
});
</script>
