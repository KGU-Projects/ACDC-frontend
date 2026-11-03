<template>
  <div>
    <PageHeader title="평가 홈" :subtitle="subtitle" />

    <div v-if="loading" class="mb-6 h-[62px]" aria-hidden="true"></div>
    <div v-else-if="current" class="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface px-4 py-3">
      <div class="min-w-0">
        <div class="text-[12px] text-muted">이어서 진행하기{{ counts.inProgress > 1 ? ` · 진행 중 ${counts.inProgress}건` : '' }}</div>
        <div class="truncate text-[14px] font-medium text-ink">{{ current.scenarioTitle }}</div>
      </div>
      <button
        type="button"
        class="h-11 rounded-control bg-primary px-4 md:h-10 text-[14px] font-medium text-white hover:bg-primaryHover"
        @click="openSession(current)"
      >이어서 진행</button>
    </div>

    <StatStrip :items="stats" />

    <LoadError v-if="loadFailed" class="mt-8" @retry="refresh" />

    <section v-if="!loadFailed" class="mt-8" aria-labelledby="home-tasks">
      <div class="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="home-tasks" class="text-[16px] font-semibold text-ink">평가 과제</h2>
        <RouterLink to="/tasks" class="-my-3 inline-flex min-h-11 items-center py-3 text-[13px] text-muted hover:text-ink hover:underline md:my-0 md:min-h-0 md:py-0">전체 보기</RouterLink>
      </div>
      <ListPlaceholder v-if="loading" variant="cards" :count="2" />
      <EmptyState v-else-if="!scenarios.length" message="등록된 평가 과제가 없습니다." />
      <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ScenarioCard v-for="s in scenarios" :key="s.id" :scenario="s" :info="infoOf(s.id)" @start="begin" />
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
  { label: '진행 중', value: show(counts.value.inProgress) },
  { label: '채점·검토 중', value: show(counts.value.reviewing) },
  { label: '결과 확인 가능', value: show(counts.value.ready) }
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
