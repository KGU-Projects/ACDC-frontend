<template>
  <div class="bg-slate-50 min-h-screen flex items-center justify-center p-4">
    <div class="bg-white shadow-2xl rounded-[2.5rem] flex flex-col max-w-sm sm:max-w-md w-full overflow-hidden h-[85vh] sm:h-[90vh]">

      <div class="px-6 pt-8 pb-4 text-center">
        <div class="flex justify-center mb-4">
          <div class="w-6 h-1.5 rounded-full bg-brand mx-1 transition-all"></div>
          <div class="w-2 h-1.5 rounded-full bg-slate-200 mx-1 transition-all"></div>
        </div>
        <h1 class="text-2xl font-bold text-slate-800 mb-1.5 tracking-tight leading-tight">어떤 직무로<br>준비하시나요?</h1>
        <p class="text-slate-400 text-[11px] font-medium">선택한 직무에 맞는 질문이 제공됩니다.</p>
      </div>

      <div class="flex-grow px-5 pt-4 pb-2 flex flex-col justify-center overflow-y-auto">
        <div class="grid grid-cols-2 gap-2.5">
          
          <button 
            v-for="job in jobList" 
            :key="job.id"
            @click="selectJob(job.id)"
            class="job-card group flex flex-col items-center text-center p-3 rounded-2xl border-2 transition-all"
            :class="selectedJobId === job.id ? 'border-brand bg-white shadow-md' : 'border-slate-50 bg-slate-50 hover:bg-white hover:border-brand/30'"
          >
            <div 
              class="w-8 h-8 rounded-lg shadow-sm flex items-center justify-center mb-2 transition-colors"
              :class="selectedJobId === job.id ? 'bg-brandLight' : 'bg-white group-hover:bg-brandLight'"
            >
              <svg 
                class="w-4 h-4 transition-colors" 
                :class="selectedJobId === job.id ? 'text-brand' : 'text-slate-400 group-hover:text-brand'"
                fill="none" stroke="currentColor" viewBox="0 0 24 24" 
                v-html="job.icon"
              ></svg>
            </div>
            <span class="text-[13px] font-bold text-slate-700 mb-0.5">{{ job.title }}</span>
            <span class="text-[9px] text-slate-400 font-medium">{{ job.subtitle }}</span>
          </button>

        </div>
      </div>

      <div class="p-5 bg-white border-t border-slate-50 mt-auto">
        <button 
          @click="submitJob" 
          :disabled="!selectedJobId" 
          class="w-full py-3.5 bg-brand text-white text-sm font-bold rounded-2xl shadow-lg shadow-brand/20 transition-all duration-300 disabled:opacity-30 disabled:grayscale hover:bg-brandHover transform active:scale-95"
        >
          다음으로
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 현재 사용자가 선택한 직무의 ID를 저장하는 변수
const selectedJobId = ref(null);

// 직무 데이터 목록 (HTML에 길게 적혀있던 내용을 데이터로 깔끔하게 정리했습니다)
const jobList = [
  { id: 'dev', title: '개발', subtitle: '백엔드/프론트', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>' },
  { id: 'pm', title: '기획/PM', subtitle: '서비스 기획', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>' },
  { id: 'design', title: '디자인', subtitle: 'UI/UX 디자인', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>' },
  { id: 'strategy', title: '경영/전략', subtitle: '컨설팅/전략', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>' },
  { id: 'hr', title: '인사/채용', subtitle: 'HR/조직문화', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>' },
  { id: 'data', title: '데이터/AI', subtitle: '분석/머신러닝', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>' },
  { id: 'finance', title: '재무/회계', subtitle: '회계/투자', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>' },
  { id: 'etc', title: '기타 직무', subtitle: '모든 공통 직무', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"></path>' }
];

// 직무 카드 클릭 시 실행되는 함수
const selectJob = (id) => {
    selectedJobId.value = id;
};

// 다음으로 버튼 클릭 시 실행되는 함수
// JobSelectView.vue 파일 하단
const submitJob = () => {
    if (selectedJobId.value) {
        console.log("선택된 직무:", selectedJobId.value);
        localStorage.setItem('selectedInterviewJob', selectedJobId.value);
        // 🌟 수정: 직무 선택 후 '면접 설정 화면'으로 넘어가도록 변경!
        router.push('/interview-setup'); 
    }
};
</script>

<style scoped>
/* 스크롤바 숨김 처리 */
::-webkit-scrollbar { display: none; }
</style>
