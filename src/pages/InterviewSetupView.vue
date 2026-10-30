<template>
  <div class="bg-slate-50 min-h-screen flex items-center justify-center p-4">
    <div class="bg-white shadow-2xl rounded-[2.5rem] flex flex-col max-w-sm w-full overflow-hidden h-[85vh] sm:h-[90vh]">

      <div class="px-6 pt-10 pb-4 text-center">
        <div class="flex justify-center mb-6">
          <div class="w-2 h-1.5 rounded-full bg-slate-200 mx-1"></div>
          <div class="w-8 h-1.5 rounded-full bg-brand mx-1"></div>
        </div>
        <h1 class="text-2xl font-bold text-slate-800 tracking-tight leading-tight">면접 방식을<br>설정해주세요</h1>
      </div>

      <div class="flex-grow overflow-y-auto px-6 hide-scrollbar">

        <div class="mb-6">
          <h3 class="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span class="w-1 h-4 bg-brand rounded-full"></span>면접 유형
          </h3>
          <div class="flex flex-col gap-2.5">
            <button 
              v-for="type in interviewTypes" :key="type.id"
              @click="selectedType = type.id"
              class="border-2 p-3.5 rounded-2xl flex items-center gap-4 text-left transition-all"
              :class="selectedType === type.id ? 'border-brand bg-brandLight/10' : 'border-slate-100 bg-white hover:border-brand/30'"
            >
              <div 
                class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                :class="selectedType === type.id ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-slate-50 text-slate-400'"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" v-html="type.icon"></svg>
              </div>
              <div>
                <p class="font-bold text-[13px]" :class="selectedType === type.id ? 'text-slate-800' : 'text-slate-700'">{{ type.title }}</p>
                <p class="text-[10px]" :class="selectedType === type.id ? 'text-brand font-semibold' : 'text-slate-400'">{{ type.subtitle }}</p>
              </div>
            </button>
          </div>
        </div>

        <div class="mb-6">
          <h3 class="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span class="w-1 h-4 bg-brand rounded-full"></span>난이도
          </h3>
          <div class="grid grid-cols-3 gap-2">
            <button 
              v-for="level in levels" :key="level"
              @click="selectedLevel = level"
              class="p-3 border-2 rounded-xl text-xs font-bold transition-all"
              :class="selectedLevel === level ? 'border-brand bg-brandLight/10 text-brand' : 'border-slate-100 bg-white text-slate-500'"
            >
              {{ level }}
            </button>
          </div>
        </div>

        <div class="mb-8">
          <h3 class="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span class="w-1 h-4 bg-brand rounded-full"></span>질문 수
          </h3>
          <div class="flex gap-2">
            <button 
              v-for="num in questionNumbers" :key="num"
              @click="selectedNum = num"
              class="w-10 h-10 rounded-full border-2 text-xs font-bold flex items-center justify-center transition-all"
              :class="selectedNum === num ? 'border-brand bg-brand text-white' : 'border-slate-100 bg-white text-slate-500'"
            >
              {{ num }}
            </button>
          </div>
        </div>
      </div>

      <div class="p-6 bg-white border-t border-slate-50">
        <button 
          @click="startInterview" 
          :disabled="isStarting"
          class="w-full py-4 bg-brand text-white font-bold rounded-2xl shadow-lg shadow-brand/20 transition-all hover:bg-brandHover transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {{ isStarting ? '질문 준비 중...' : '면접 시작하기' }}
        </button>
        <p v-if="startError" class="mt-3 text-xs text-red-500 font-semibold text-center break-keep">
          {{ startError }}
        </p>
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { createInterviewSession, startInterviewSession } from '../api/interview';

const router = useRouter();

// 선택된 옵션들을 담을 변수 (기본값 설정)
const selectedType = ref('total');
const selectedLevel = ref('중급');
const selectedNum = ref(5);
const isStarting = ref(false);
const startError = ref('');

// 화면에 보여줄 데이터 목록
const interviewTypes = [
  { id: 'personality', title: '인성 면접', subtitle: '태도, 가치관, 경험 기반', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>' },
  { id: 'job', title: '직무 면접', subtitle: '전공 지식 및 실무 역량', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>' },
  { id: 'total', title: '종합 면접', subtitle: '인성 + 직무 통합', icon: '<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>' }
];
const levels = ['초급', '중급', '고급'];
const questionNumbers = [3, 5, 10];

const categoryMap = {
  dev: 'BACKEND',
  pm: 'PLANNING',
  design: 'DESIGN',
  strategy: 'STRATEGY',
  hr: 'HR',
  data: 'AI',
  finance: 'FINANCE',
  etc: 'GENERAL'
};

const interviewTypeMap = {
  personality: 'PERSONALITY',
  job: 'TECH',
  total: 'COMPREHENSIVE'
};

const difficultyMap = {
  초급: 'EASY',
  중급: 'NORMAL',
  고급: 'HARD'
};

const createStartPayload = () => {
  const selectedJob = localStorage.getItem('selectedInterviewJob') || 'dev';

  return {
    category: categoryMap[selectedJob] || 'BACKEND',
    interviewType: interviewTypeMap[selectedType.value] || 'TECH',
    difficulty: difficultyMap[selectedLevel.value] || 'NORMAL',
    questionCount: selectedNum.value,
    timePerQuestion: 60,
    resumeContent: localStorage.getItem('resumeContent') || ''
  };
};

// 면접 시작 버튼 클릭 시
const startInterview = async () => {
    if (isStarting.value) return;

    isStarting.value = true;
    startError.value = '';

    try {
        const session = await createInterviewSession();
        const sessionId = session.sessionId;
        const setting = createStartPayload();

        await startInterviewSession(sessionId, setting);

        localStorage.setItem('sessionId', String(sessionId));
        localStorage.setItem('interviewSetting', JSON.stringify(setting));

        router.push({
            path: '/interview',
            query: { sessionId }
        });
    } catch (error) {
        console.error('면접 시작 API 호출 실패:', error);
        startError.value = error.message || '면접 세션을 시작하지 못했습니다. 잠시 후 다시 시도해주세요.';
    } finally {
        isStarting.value = false;
    }
};
</script>

<style scoped>
/* 스크롤바 숨김 처리 */
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
