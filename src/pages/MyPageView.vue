<template>
  <div class="bg-slate-50 min-h-screen flex items-center justify-center p-4">
    <div class="bg-white shadow-2xl rounded-[2.5rem] flex flex-col max-w-sm sm:max-w-md w-full overflow-hidden h-[85vh] sm:h-[90vh] relative">

      <div class="w-full px-6 pt-8 pb-4 flex items-center relative z-10 border-b border-slate-100">
        <button @click="goToHome" class="p-2 -ml-2 mr-2 bg-transparent rounded-full hover:bg-slate-50 text-slate-500 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <h1 class="text-xl font-bold text-slate-800 tracking-tight">마이페이지</h1>
      </div>

      <div class="px-6 py-8 bg-white border-b border-slate-100 flex items-center gap-5">
        <div class="w-16 h-16 rounded-full bg-brandLight flex items-center justify-center shadow-inner">
          <svg class="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
        </div>
        <div class="flex-1">
          <h2 class="text-lg font-extrabold text-slate-800 mb-0.5">{{ userName }} <span class="text-sm font-medium text-slate-400">님</span></h2>
          <p class="text-xs text-slate-400 font-medium mb-2">{{ userEmail }}</p>
          <button class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold rounded-lg transition-colors">
            프로필 수정하기
          </button>
        </div>
      </div>

      <div class="flex-grow overflow-y-auto px-6 py-4">
        <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-1">앱 설정 및 관리</h3>

        <div class="flex flex-col gap-1">
          <button @click="goToReport" class="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-brandLight/50 flex items-center justify-center text-brand group-hover:bg-brandLight transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              </div>
              <span class="text-sm font-bold text-slate-700">나의 면접 리포트</span>
            </div>
            <svg class="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </button>

          <button class="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-slate-200 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              </div>
              <span class="text-sm font-bold text-slate-700">카메라 및 마이크 설정</span>
            </div>
            <svg class="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </button>

          <button class="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-slate-200 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <span class="text-sm font-bold text-slate-700">자주 묻는 질문 (FAQ)</span>
            </div>
            <svg class="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>
      </div>

      <div class="px-6 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between mt-auto">
        <span class="text-xs font-bold text-slate-300">버전 1.0.0</span>

        <button @click="handleLogout" class="text-xs font-bold text-rose-400 hover:text-rose-500 transition-colors py-2 px-3 hover:bg-rose-50 rounded-lg">
          로그아웃
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { clearAuthSession, getMe, getStoredUser, logout } from '../api/auth';

const router = useRouter();
const user = ref(getStoredUser());

const userName = computed(() => user.value?.name || '사용자');
const userEmail = computed(() => user.value?.email || '');

onMounted(async () => {
    if (!localStorage.getItem('accessToken')) return;

    try {
        user.value = await getMe();
    } catch (error) {
        console.error('내 정보 조회 실패:', error);
    }
});

// 1. 뒤로가기 누르면 홈으로
const goToHome = () => {
    router.push('/home');
};

// 2. 리포트 누르면 리포트 화면으로
const goToReport = () => {
    router.push('/report');
};

// 🌟 3. 핵심: 로그아웃 로직 (토큰 삭제 및 이동)
const handleLogout = async () => {
    const isConfirm = confirm("정말 로그아웃 하시겠습니까?");

    if (isConfirm) {
        const refreshToken = localStorage.getItem('refreshToken');

        try {
            if (refreshToken) {
                await logout(refreshToken);
            }
        } catch (error) {
            console.error('로그아웃 API 호출 실패:', error);
        } finally {
            clearAuthSession();
        }
        
        alert('안전하게 로그아웃 되었습니다.');
        
        // 로그인 화면(첫 화면)으로 쫓아냅니다.
        router.push('/login');
    }
};
</script>

<style scoped>
/* 스크롤바 숨김 처리 */
::-webkit-scrollbar { display: none; }
</style>
