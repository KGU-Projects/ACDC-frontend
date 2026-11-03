<template>
  <div>
    <PageHeader title="평가 과제" :subtitle="loading ? '' : `응시할 수 있는 과제 ${scenarios.length}건`" />

    <div class="mb-5 flex flex-wrap items-center gap-3">
      <div class="inline-flex rounded-control border border-control bg-surface p-0.5" role="group" aria-label="과제 유형">
        <button
          v-for="opt in typeOptions"
          :key="opt.value"
          type="button"
          class="h-11 rounded-[4px] border px-3 text-[14px] md:h-9"
          :class="typeFilter === opt.value ? 'border-control bg-ground font-semibold text-ink' : 'border-transparent text-muted hover:text-ink'"
          :aria-pressed="typeFilter === opt.value"
          @click="typeFilter = opt.value"
        >{{ opt.label }}</button>
      </div>
      <label class="min-w-0 flex-1 sm:max-w-xs">
        <span class="sr-only">과제명 검색</span>
        <input
          v-model="query"
          type="search"
          placeholder="과제명 검색"
          class="field-input h-11 w-full md:h-10 rounded-control border border-control bg-surface px-3 text-[14px] text-ink placeholder:text-faint"
        />
      </label>
    </div>

    <ListPlaceholder v-if="loading" variant="cards" :count="2" />
    <LoadError v-else-if="loadFailed" @retry="refresh" />
    <EmptyState v-else-if="!scenarios.length" message="등록된 평가 과제가 없습니다." />
    <EmptyState v-else-if="!filtered.length" message="조건에 맞는 과제가 없습니다." />
    <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <ScenarioCard v-for="s in filtered" :key="s.id" :scenario="s" :info="infoOf(s.id)" @start="begin" />
    </div>

    <StartModal :scenario="target" :sessions="sessions" :starting="starting" :error="errorMessage" @close="closeModal" @confirm="(mode) => start(target, mode)" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import PageHeader from '../components/ui/PageHeader.vue';
import EmptyState from '../components/ui/EmptyState.vue';
import ScenarioCard from '../components/ScenarioCard.vue';
import LoadError from '../components/LoadError.vue';
import ListPlaceholder from '../components/ListPlaceholder.vue';
import StartModal from '../components/StartModal.vue';
import { useSessions } from '../composables/useSessions';
import { useScenarioCards } from '../composables/useScenarioCards';

const { sessions, scenarios, loading, starting, errorMessage, loadFailed, refresh, start } = useSessions();
const infoOf = useScenarioCards(scenarios);

const typeOptions = [
  { value: '', label: '전체' },
  { value: 'IN_BASKET', label: '서류함' },
  { value: 'ROLE_PLAY', label: '역할수행' }
];
const typeFilter = ref('');
const query = ref('');
const target = ref(null);

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return scenarios.value.filter((s) => (!typeFilter.value || s.type === typeFilter.value) && (!q || (s.title || '').toLowerCase().includes(q)));
});

const closeModal = () => {
  target.value = null;
  errorMessage.value = '';
};
const begin = (scenario) => {
  errorMessage.value = '';
  target.value = scenario;
};
</script>
