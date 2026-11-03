<template>
  <div>
    <PageHeader title="평가 이용 안내" subtitle="과제를 고른 뒤 제출하고 결과를 확인하기까지의 흐름입니다." />

    <ol class="divide-y divide-rule rounded-card border border-line bg-surface">
      <li v-for="(step, i) in steps" :key="step.title" class="flex gap-4 px-4 py-4 sm:px-5">
        <span class="w-5 shrink-0 pt-[2px] text-[14px] font-medium text-muted tabular-nums" aria-hidden="true">{{ i + 1 }}</span>
        <div class="min-w-0">
          <h2 class="text-[16px] font-semibold leading-6 text-ink"><span class="sr-only">{{ i + 1 }}단계. </span>{{ step.title }}</h2>
          <ul class="mt-1.5 space-y-1">
            <li v-for="line in step.lines" :key="line" class="text-[14px] leading-6 text-muted">{{ line }}</li>
          </ul>
        </div>
      </li>
    </ol>

    <p class="mt-4 text-[14px] leading-6 text-muted">권장 환경은 데스크톱 Chrome이며, 역할수행에는 카메라와 마이크가 필요합니다.</p>

    <div class="mt-6">
      <RouterLink to="/tasks" class="inline-flex h-11 items-center gap-1.5 rounded-control border border-control bg-surface px-4 text-[14px] font-medium text-ink hover:bg-ground md:h-10">
        평가 과제 보기
        <AppIcon name="arrow-right" :size="14" />
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import PageHeader from '../components/ui/PageHeader.vue';
import AppIcon from '../components/ui/AppIcon.vue';

const steps = [
  {
    title: '과제 선택',
    lines: ['평가 과제에서 과제를 고르고 연습 또는 실전으로 시작합니다.', '연습은 횟수 제한 없이 응시할 수 있고, 실전은 과제당 한 번만 응시하며 중간에 멈출 수 없습니다.']
  },
  {
    title: '과제 수행',
    lines: [
      '서류함: 자료를 검토한 뒤 답안을 작성합니다. 답안은 자동으로 저장됩니다.',
      '역할수행: 과제 숙지 40분 뒤 영상통화 면담 20분이 이어집니다. 카메라와 마이크를 허용해야 면담을 시작할 수 있습니다.'
    ]
  },
  {
    title: '제출',
    lines: ['제한 시간이 끝나면 작성한 답안이나 면담 내용이 자동으로 제출됩니다.', '브라우저를 닫아 제한 시간까지 제출되지 않으면 중단됨으로 기록되며 채점하지 않습니다.']
  },
  {
    title: '결과 확인',
    lines: ['연습은 AI 채점이 끝나면 확인할 수 있으며 최대 1시간 정도 걸립니다.', '실전은 AI 채점 후 FT가 검토하고, 관리자가 정한 공개 시각에 확인할 수 있습니다.']
  }
];
</script>
