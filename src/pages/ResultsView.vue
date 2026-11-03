<template>
  <div>
    <PageHeader title="역량 분석 결과" :subtitle="loading || loadFailed ? '' : `확인할 수 있는 결과 ${ready.length}건`" />

    <ListPlaceholder v-if="loading" variant="rows" :count="3" />
    <LoadError v-else-if="loadFailed" @retry="refresh" />
    <template v-else>
      <EmptyState v-if="!ready.length" message="확인할 수 있는 결과가 아직 없습니다.">
        <template #action>
          <RouterLink to="/records" class="rounded-control text-[14px] font-medium text-ink underline underline-offset-2">나의 응시 내역 보기</RouterLink>
        </template>
      </EmptyState>
      <ul v-else class="divide-y divide-rule rounded-card border border-line bg-surface">
        <li v-for="s in ready" :key="s.id">
          <RouterLink :to="`/result/${s.id}`" class="flex min-h-[56px] items-center justify-between gap-3 px-4 py-3 hover:bg-hover">
            <span class="min-w-0">
              <span class="block truncate text-[14px] font-medium text-ink">{{ s.scenarioTitle }}</span>
              <span class="mt-0.5 block text-[12px] text-muted tabular-nums">{{ typeLabel(s.scenarioType) }} · {{ modeLabel(s.mode) }} · {{ formatDate(s.createdAt) || '–' }}</span>
            </span>
            <span class="flex shrink-0 items-center gap-1 text-[14px] font-medium text-ink">
              결과 보기
              <AppIcon name="chevron-right" :size="14" class="text-faint" />
            </span>
          </RouterLink>
        </li>
      </ul>
      <p v-if="pendingCount > 0" class="mt-4 text-[14px] text-muted">결과 대기 {{ pendingCount }}건 — 나의 응시 내역에서 진행 상황을 확인하세요</p>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import PageHeader from '../components/ui/PageHeader.vue';
import EmptyState from '../components/ui/EmptyState.vue';
import AppIcon from '../components/ui/AppIcon.vue';
import LoadError from '../components/LoadError.vue';
import ListPlaceholder from '../components/ListPlaceholder.vue';
import { useSessions } from '../composables/useSessions';
import { canOpenResult, formatDate, isPolling, modeLabel, typeLabel } from '../composables/stage';

const { sessions, loading, loadFailed, refresh } = useSessions();

const time = (s) => new Date(s.createdAt).getTime() || 0;
// 공개된 결과만 목록에 올린다. 공개 전 세션은 점수는 물론 제목도 보이지 않고 건수만 센다.
const ready = computed(() => sessions.value.filter((s) => canOpenResult(s.stage)).sort((a, b) => time(b) - time(a)));
const pendingCount = computed(() => sessions.value.filter((s) => isPolling(s.stage)).length);
</script>
