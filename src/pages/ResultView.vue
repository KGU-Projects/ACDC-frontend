<template>
  <div class="bg-slate-50 min-h-screen p-3 sm:p-4">
    <div class="max-w-3xl mx-auto">
      <header class="bg-white rounded-2xl shadow px-5 py-4 flex items-center justify-between mb-4">
        <div>
          <h1 class="text-base font-extrabold text-slate-800">{{ session?.scenarioTitle || '결과' }}</h1>
          <p v-if="session" class="text-[11px] text-slate-400">{{ session.scenarioType === 'IN_BASKET' ? '서류함' : '역할수행' }} · {{ statusLabel }}</p>
        </div>
        <button @click="router.push('/home')" class="text-sm font-bold text-brand">홈으로</button>
      </header>

      <p v-if="errorMessage" class="text-center text-rose-500 font-bold text-sm mt-10">{{ errorMessage }}</p>
      <p v-else-if="!session" class="text-center text-slate-400 text-sm mt-10">불러오는 중...</p>

      <template v-else>
        <div v-if="!session.evaluations?.length" class="bg-white rounded-2xl shadow p-8 text-center text-sm text-slate-500">
          아직 채점 결과가 없습니다. 상태: {{ statusLabel }}
        </div>

        <div v-else class="space-y-4">
          <article v-for="e in session.evaluations" :key="e.competency" class="bg-white rounded-2xl shadow p-5">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-base font-bold text-slate-800">{{ e.competency }}</h2>
              <div class="text-right">
                <span class="text-2xl font-extrabold text-brand">{{ e.finalScore ?? e.aiScore }}</span><span class="text-xs text-slate-400"> / 5</span>
                <p v-if="e.finalScore != null && e.finalScore !== e.aiScore" class="text-[10px] text-slate-400">AI 점수 {{ e.aiScore }} → FT 확정</p>
              </div>
            </div>

            <div v-if="e.aiEvidence?.length" class="mb-3">
              <h3 class="text-xs font-bold text-slate-500 mb-1">근거</h3>
              <ul class="space-y-1">
                <li v-for="(ev, i) in e.aiEvidence" :key="i" class="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">“{{ ev }}”</li>
              </ul>
            </div>

            <div>
              <h3 class="text-xs font-bold text-slate-500 mb-1">피드백</h3>
              <p class="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{{ e.aiFeedback }}</p>
            </div>

            <div v-if="e.ftComment" class="mt-3 border-t border-slate-100 pt-3">
              <h3 class="text-xs font-bold text-slate-500 mb-1">FT 코멘트</h3>
              <p class="text-sm text-slate-700 whitespace-pre-wrap">{{ e.ftComment }}</p>
            </div>
          </article>
        </div>

        <section v-if="session.scenarioType === 'ROLE_PLAY' && session.turns?.length" class="bg-white rounded-2xl shadow p-5 mt-4">
          <h2 class="text-sm font-bold text-slate-800 mb-3">대화 기록</h2>
          <ul class="space-y-2">
            <li v-for="t in session.turns" :key="t.seq" class="text-sm">
              <span class="font-bold" :class="t.speaker === 'USER' ? 'text-brand' : 'text-slate-500'">{{ t.speaker === 'USER' ? '나' : '상대역' }}</span>
              <span class="text-slate-700"> {{ t.text }}</span>
            </li>
          </ul>
        </section>

        <section v-else-if="session.scenarioType === 'IN_BASKET' && session.answer" class="bg-white rounded-2xl shadow p-5 mt-4">
          <h2 class="text-sm font-bold text-slate-800 mb-3">제출한 답안</h2>
          <p class="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{{ session.answer }}</p>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getSession } from '../api/acdc';

const route = useRoute();
const router = useRouter();

const session = ref(null);
const errorMessage = ref('');

const STATUS_LABELS = {
  READY: '준비',
  IN_PROGRESS: '진행 중',
  SUBMITTED: '채점 중',
  SCORED: 'AI 채점 완료',
  CONFIRMED: 'FT 확정'
};
const statusLabel = computed(() => STATUS_LABELS[session.value?.status] || session.value?.status || '');

onMounted(async () => {
  try {
    session.value = await getSession(route.params.id);
  } catch (error) {
    errorMessage.value = error.message || '결과를 불러오지 못했습니다.';
  }
});
</script>
