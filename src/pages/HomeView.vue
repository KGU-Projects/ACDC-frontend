<template>
  <div class="bg-slate-50 min-h-screen flex items-center justify-center p-4">
    
    <div class="bg-white shadow-2xl rounded-[2.5rem] flex flex-col max-w-sm sm:max-w-md w-full overflow-hidden h-[85vh] sm:h-[90vh] relative">

      <div class="w-full px-6 pt-8 pb-4 flex justify-between items-center relative z-10">
        <div class="text-xl font-extrabold text-slate-800 tracking-tight">Career-View</div>
        <button @click="goToMyPage" class="p-2.5 bg-slate-50 rounded-full hover:bg-brandLight hover:text-brand text-slate-400 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
          </svg>
        </button>
      </div>

      <div class="flex-grow flex flex-col items-center justify-center px-6 pb-12 w-full">

        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold text-slate-800 mb-1.5">반갑습니다 👋</h2>
          <p class="text-slate-500 text-sm">성공적인 면접을 위해 무엇을 도와드릴까요?</p>
        </div>

        <div class="w-full space-y-4 px-8">
          
          <button @click="startInterview" class="w-full bg-brand text-white p-5 rounded-2xl shadow-lg shadow-brand/30 hover:bg-brandHover transition-all flex flex-col items-center gap-2 transform active:scale-95 relative overflow-hidden group">
            <div class="absolute -top-10 -right-10 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all"></div>
            <svg class="w-8 h-8 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
            <div class="relative z-10 text-center">
              <span class="block text-lg font-bold mb-0.5">면접 시작</span>
              <span class="block text-[10px] text-brandLight font-medium">AI 스마트 거울과 함께 실전 연습</span>
            </div>
          </button>

          <button @click="viewReports" class="w-full bg-white border-2 border-slate-100 text-slate-700 p-5 rounded-2xl shadow-sm hover:border-brand/40 hover:bg-slate-50 transition-all flex flex-col items-center gap-2 transform active:scale-95 group">
            <svg class="w-8 h-8 text-slate-300 group-hover:text-brand transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            <div class="text-center">
              <span class="block text-lg font-bold mb-0.5">면접 리포트</span>
              <span class="block text-[10px] text-slate-400 font-medium transition-colors group-hover:text-slate-500">과거의 감정 분석 결과 확인하기</span>
            </div>
          </button>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

// 🌟 면접 시작 버튼 클릭 시 작동하는 함수
const startInterview = () => {
    router.push('/job-select');
};

// 리포트 버튼 클릭 시
const viewReports = () => {
    // 🌟 alert 창을 지우고, 방금 만든 리포트 뷰로 이동시킵니다!
    router.push('/report');
};

// 🌟 우측 상단 마이페이지 버튼 클릭 시 (아직 화면이 없으므로 임시 알림창 처리)
// 홈 화면(HomeView.vue) 하단
const goToMyPage = () => {
    // 🌟 alert 창을 지우고, 방금 만든 마이페이지로 이동시킵니다!
    router.push('/mypage'); 
};
</script>
