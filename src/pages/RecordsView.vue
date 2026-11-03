<template>
  <div>
    <PageHeader title="나의 응시 내역" :subtitle="loading ? '' : `전체 ${sessions.length}건`" />

    <template v-if="loading">
      <ListPlaceholder class="hidden sm:block" variant="table" :count="4" />
      <ListPlaceholder class="sm:hidden" variant="rows" :count="4" />
    </template>
    <LoadError v-else-if="loadFailed" @retry="refresh" />
    <EmptyState v-else-if="!sessions.length" message="아직 응시한 평가가 없습니다.">
      <template #action>
        <RouterLink to="/tasks" class="text-[14px] font-medium text-ink underline underline-offset-2">평가 과제 보러 가기</RouterLink>
      </template>
    </EmptyState>
    <template v-else>
      <div class="hidden overflow-hidden rounded-card border border-line bg-surface sm:block">
        <table class="w-full text-left text-[14px]">
          <thead>
            <tr class="border-b border-line text-[12px] font-normal text-muted">
              <th scope="col" class="w-[42%] px-4 py-2.5 font-normal">과제</th>
              <th scope="col" class="px-4 py-2.5 font-normal">유형</th>
              <th scope="col" class="px-4 py-2.5 font-normal">모드</th>
              <th scope="col" class="px-4 py-2.5 font-normal">시작일</th>
              <th scope="col" class="px-4 py-2.5 font-normal">단계</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-rule">
            <tr v-for="s in sessions" :key="s.id" :class="clickable(s) ? 'cursor-pointer hover:bg-ground' : ''" @click="clickable(s) && openSession(s)">
              <td class="max-w-0 px-4 py-3 text-ink">
                <button v-if="clickable(s)" type="button" class="block max-w-full truncate text-left font-medium hover:underline" @click.stop="openSession(s)">{{ s.scenarioTitle }}</button>
                <span v-else class="block truncate font-medium">{{ s.scenarioTitle }}</span>
              </td>
              <td class="whitespace-nowrap px-4 py-3 text-muted">{{ typeLabel(s.scenarioType) }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-muted">{{ modeLabel(s.mode) }}</td>
              <td class="whitespace-nowrap px-4 py-3 text-muted tabular-nums">{{ formatDate(s.createdAt) || '–' }}</td>
              <td class="whitespace-nowrap px-4 py-3"><StatusPill :label="stageLabel(s.stage)" :tone="stageTone(s.stage)" /></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="sm:hidden">
        <SessionRows :sessions="sessions" @open="openSession" />
      </div>
    </template>
  </div>
</template>

<script setup>
import PageHeader from '../components/ui/PageHeader.vue';
import EmptyState from '../components/ui/EmptyState.vue';
import StatusPill from '../components/ui/StatusPill.vue';
import LoadError from '../components/LoadError.vue';
import ListPlaceholder from '../components/ListPlaceholder.vue';
import SessionRows from '../components/SessionRows.vue';
import { useSessions } from '../composables/useSessions';
import { canOpenResult, formatDate, modeLabel, stageLabel, stageTone, typeLabel } from '../composables/stage';

const { sessions, loading, loadFailed, refresh, openSession } = useSessions();
const clickable = (s) => s.stage === 'IN_PROGRESS' || canOpenResult(s.stage);
</script>
