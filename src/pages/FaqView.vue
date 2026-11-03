<template>
  <div>
    <PageHeader title="자주 묻는 질문" />

    <ul class="divide-y divide-rule rounded-card border border-line bg-surface">
      <li v-for="(item, i) in items" :key="item.q">
        <h2>
          <button
            type="button"
            :id="`faq-q-${i}`"
            :aria-expanded="openIndex === i"
            :aria-controls="`faq-a-${i}`"
            class="flex min-h-[48px] w-full items-center justify-between gap-4 px-4 py-3 text-left text-[15px] font-medium text-ink hover:bg-ground sm:px-5"
            @click="openIndex = openIndex === i ? -1 : i"
          >
            <span>{{ item.q }}</span>
            <AppIcon name="chevron-right" :size="16" class="text-faint" :class="openIndex === i ? 'rotate-90' : ''" />
          </button>
        </h2>
        <div v-show="openIndex === i" :id="`faq-a-${i}`" role="region" :aria-labelledby="`faq-q-${i}`" class="px-4 pb-4 sm:px-5">
          <p class="max-w-[62ch] text-[14px] leading-6 text-muted">{{ item.a }}</p>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import PageHeader from '../components/ui/PageHeader.vue';
import AppIcon from '../components/ui/AppIcon.vue';

const openIndex = ref(-1);

const items = [
  {
    q: '연습과 실전은 어떻게 다른가요?',
    a: '연습은 횟수 제한 없이 응시할 수 있고 AI 채점이 끝나면 바로 결과를 볼 수 있습니다. 실전은 과제당 한 번만 응시하며 중간에 멈출 수 없고, AI 채점 후 FT가 검토한 결과를 관리자가 정한 시각에 확인합니다.'
  },
  {
    q: '"임시 저장 후 나가기"는 무엇인가요?',
    a: '연습 모드의 서류함에서 답안을 저장하고 타이머를 멈춘 채 나가는 기능입니다. 다시 들어오면 멈춘 시각부터 이어서 진행합니다. 실전에는 이 기능이 없습니다.'
  },
  {
    q: '제한 시간이 끝나면 어떻게 되나요?',
    a: '작성 중인 답안이나 진행 중인 면담이 자동으로 제출됩니다. 다만 브라우저를 닫는 등으로 제한 시간까지 제출되지 않으면 중단됨으로 기록되고 채점하지 않습니다.'
  },
  {
    q: '카메라나 마이크가 켜지지 않아요.',
    a: '역할수행은 카메라와 마이크를 허용해야 면담을 시작할 수 있습니다. 브라우저 주소창의 권한 설정에서 두 장치를 허용한 뒤 화면의 다시 요청을 눌러 주세요. 다른 앱이 장치를 쓰고 있다면 종료한 뒤 다시 시도합니다.'
  },
  {
    q: '결과는 언제 확인할 수 있나요?',
    a: '연습은 제출 후 AI 채점이 끝나면 확인할 수 있으며 최대 1시간 정도 걸립니다. 실전은 FT 검토가 끝난 뒤 관리자가 정한 공개 시각부터 확인할 수 있습니다. 진행 상황은 나의 응시 내역에서 볼 수 있습니다.'
  },
  {
    q: '실전을 다시 응시할 수 있나요?',
    a: '실전은 과제당 한 번만 응시할 수 있습니다. 같은 과제를 다시 해 보려면 연습으로 시작해 주세요.'
  }
];
</script>
