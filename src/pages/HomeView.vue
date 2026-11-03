<template>
  <div>
    <PageHeader title="평가 홈" :subtitle="subtitle" />

    <div v-if="loading" class="mb-3 h-[136px] rounded-card border border-line bg-surface" aria-hidden="true"></div>
    <!-- 이 화면의 질문 "지금 무엇을 이어서 하면 되는가"에 답하는 가장 큰 블록 -->
    <section v-else-if="current" class="mb-3 grid gap-4 rounded-card border border-line bg-surface p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:px-6" aria-labelledby="home-current">
      <div class="min-w-0">
        <p class="text-[12px] text-muted">이어서 진행할 평가{{ counts.inProgress > 1 ? ` · 진행 중 ${counts.inProgress}건` : '' }}</p>
        <h2 id="home-current" class="mt-1 truncate text-[18px] font-semibold leading-7 text-ink">{{ current.scenarioTitle }}</h2>
        <p class="mt-0.5 text-[13px] text-muted tabular-nums">{{ typeLabel(current.scenarioType) }} · {{ modeLabel(current.mode) }} · {{ formatDate(current.createdAt) || '–' }} 시작</p>
        <div class="mt-4 max-w-[420px]"><StageTrack :stage="current.stage" :mode="current.mode" size="full" /></div>
      </div>
      <button
        type="button"
        class="h-11 justify-self-start rounded-control bg-primary px-5 text-[14px] font-medium text-white hover:bg-primaryHover md:h-10"
        @click="openSession(current)"
      >이어서 진행</button>
    </section>

    <StatStrip :items="stats" />

    <LoadError v-if="loadFailed" class="mt-8" @retry="refresh" />

    <section v-if="!loadFailed" class="mt-8" aria-labelledby="home-tasks">
      <div class="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="home-tasks" class="text-[16px] font-semibold text-ink">평가 과제<template v-if="!loading && scenarios.length"> <span class="ml-1 text-[14px] font-normal text-muted tabular-nums" aria-hidden="true">{{ scenarios.length }}</span><span class="sr-only">{{ scenarios.length }}건</span></template></h2>
        <RouterLink to="/tasks" class="-my-3 inline-flex min-h-11 items-center py-3 text-[13px] text-muted hover:text-ink hover:underline md:my-0 md:min-h-0 md:py-0">전체 보기</RouterLink>
      </div>
      <ListPlaceholder v-if="loading" variant="cards" :count="2" />
      <EmptyState v-else-if="!scenarios.length" message="등록된 평가 과제가 없습니다." />
      <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <ScenarioCard v-for="s in scenarios" :key="s.id" :scenario="s" :info="infoOf(s.id)" :sessions="sessions" @start="begin" />
      </div>
    </section>

    <section v-if="!loadFailed" class="mt-8" aria-labelledby="home-recent">
      <div class="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="home-recent" class="text-[16px] font-semibold text-ink">최근 응시 내역</h2>
        <RouterLink to="/records" class="-my-3 inline-flex min-h-11 items-center py-3 text-[13px] text-muted hover:text-ink hover:underline md:my-0 md:min-h-0 md:py-0">전체 보기</RouterLink>
      </div>
      <ListPlaceholder v-if="loading" variant="rows" :count="3" />
      <EmptyState v-else-if="!sessions.length" message="아직 응시한 평가가 없습니다." />
      <SessionRows v-else :sessions="sessions.slice(0, 5)" @open="openSession" />
    </section>

    <StartModal :scenario="target" :sessions="sessions" :starting="starting" :error="errorMessage" @close="closeModal" @confirm="confirmStart" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import PageHeader from '../components/ui/PageHeader.vue';
import StatStrip from '../components/ui/StatStrip.vue';
import EmptyState from '../components/ui/EmptyState.vue';
import ScenarioCard from '../components/ScenarioCard.vue';
import SessionRows from '../components/SessionRows.vue';
import LoadError from '../components/LoadError.vue';
import ListPlaceholder from '../components/ListPlaceholder.vue';
import StartModal from '../components/StartModal.vue';
import StageTrack from '../components/ui/StageTrack.vue';
import { formatDate, modeLabel, typeLabel } from '../composables/stage';
import { useSessions } from '../composables/useSessions';
import { useScenarioCards } from '../composables/useScenarioCards';

const { sessions, scenarios, loading, starting, errorMessage, loadFailed, counts, refresh, start, openSession } = useSessions();
const infoOf = useScenarioCards(scenarios);

const target = ref(null);
const begin = (scenario) => {
  errorMessage.value = '';
  target.value = scenario;
};
const closeModal = () => {
  target.value = null;
  errorMessage.value = '';
};
const confirmStart = (mode) => start(target.value, mode);

const current = computed(() => sessions.value.find((s) => s.stage === 'IN_PROGRESS') || null);

// 목록을 아직 못 가져왔으면 0이 아니라 대시로 둔다.
const loaded = computed(() => !loading.value && !loadFailed.value);
const show = (n) => (loaded.value ? n : '–');
const stats = computed(() => [
  { label: '응시 가능한 과제', value: show(counts.value.available) },
  { label: '진행 중', value: show(counts.value.inProgress), accent: counts.value.inProgress > 0 },
  { label: '채점·검토 중', value: show(counts.value.reviewing) },
  { label: '결과 확인 가능', value: show(counts.value.ready), accent: counts.value.ready > 0 }
]);

const subtitle = computed(() => {
  if (loading.value) return '\u00A0'; // 불러오는 동안 부제 줄 높이를 비워 두어 내용이 밀리지 않게 한다.
  if (!loaded.value) return '';
  if (counts.value.inProgress) return `진행 중인 평가 ${counts.value.inProgress}건`;
  if (counts.value.ready) return `확인할 수 있는 결과 ${counts.value.ready}건`;
  if (counts.value.reviewing) return `채점·검토 중인 평가 ${counts.value.reviewing}건`;
  return '진행 중인 평가가 없습니다';
});
</script>
