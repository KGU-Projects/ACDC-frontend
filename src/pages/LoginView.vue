<template>
  <div class="bg-slate-50 min-h-screen flex items-center justify-center p-4">
    <div class="bg-white shadow-2xl rounded-2xl flex flex-col max-w-sm sm:max-w-md w-full overflow-hidden">
      
      <div class="w-full bg-brandLight/40 py-10 px-6 flex flex-col justify-center items-center text-center relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-brand/10 to-transparent"></div>

        <div class="relative z-10">
          <h1 class="text-3xl font-extrabold text-slate-800 mb-1 tracking-tight">Career-View</h1>
          <p class="text-brand font-semibold text-sm mb-6">지능형 모의 면접 스마트 거울</p>

          <div class="relative w-28 h-28 mx-auto flex justify-center items-center">
            <div class="absolute inset-0 border-4 border-brand/30 rounded-2xl animate-[pulse_2s_ease-in-out_infinite]"></div>
            <div class="absolute inset-2 border-2 border-brand/50 rounded-xl border-dashed animate-[spin_15s_linear_infinite]"></div>
            <svg class="w-12 h-12 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8v-2a2 2 0 0 1 2-2h2m10 0h2a2 2 0 0 1 2 2v2m0 8v2a2 2 0 0 1-2 2h-2m-10 0h-2a2 2 0 0 1-2-2v-2"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 10a2 2 0 1 1 4 0 2 2 0 0 1-4 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 14c0-2-2-3-4-3s-4 1-4 3v1h8v-1z"></path>
            </svg>
          </div>
        </div>
      </div>

      <div class="w-full p-6 sm:p-8">
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-slate-800 mb-1">환영합니다 👋</h2>
          <p class="text-slate-500 text-sm">성공적인 면접을 위한 첫 걸음을 시작하세요.</p>
        </div>

        <form @submit.prevent="handleLogin">
          <div class="mb-4">
            <label for="email" class="block text-slate-700 text-xs font-bold mb-2">이메일</label>
            <input v-model="email" type="email" id="email" class="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all duration-300 text-sm" placeholder="user@example.com" :disabled="isSubmitting" required>
          </div>

          <div class="mb-6">
            <label for="password" class="block text-slate-700 text-xs font-bold mb-2">비밀번호</label>
            <input v-model="password" type="password" id="password" class="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all duration-300 text-sm" placeholder="••••••••" :disabled="isSubmitting" required>
            <div class="flex justify-end mt-2">
              <a href="#" class="text-xs font-semibold text-brand hover:text-brandHover transition-colors">비밀번호를 잊으셨나요?</a>
            </div>
          </div>

          <p v-if="errorMessage" class="mb-4 text-xs font-bold text-rose-500">
            {{ errorMessage }}
          </p>

          <button type="submit" :disabled="isSubmitting" class="w-full bg-brand hover:bg-brandHover disabled:bg-slate-300 disabled:shadow-none disabled:transform-none text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand/30 hover:shadow-brand/50 transition-all duration-300 transform hover:-translate-y-0.5 text-sm">
            {{ isSubmitting ? '로그인 중...' : '로그인' }}
          </button>
        </form>

        <div class="mt-6 flex items-center justify-between">
          <span class="border-b w-1/4 border-slate-200"></span>
          <span class="text-[10px] text-center text-slate-400 font-medium uppercase tracking-widest">OR</span>
          <span class="border-b w-1/4 border-slate-200"></span>
        </div>

        <button @click="startGoogleLogin" :disabled="isSubmitting" class="w-full mt-5 py-2.5 border border-slate-200 rounded-xl text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-60 font-bold flex items-center justify-center gap-2 transition-colors text-sm">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google 계정으로 계속하기
        </button>

        <p class="mt-8 text-center text-xs text-slate-600 font-medium">
          아직 계정이 없으신가요?
          <a href="#" @click.prevent="goToSignup" class="font-bold text-brand hover:text-brandHover hover:underline transition-all duration-300 ml-1.5">지금 바로 회원가입</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { getGoogleOAuthUrl, login, saveAuthSession } from '../api/auth';

const email = ref('');
const password = ref('');
const isSubmitting = ref(false);
const errorMessage = ref('');
const router = useRouter(); 

const handleLogin = async () => {
    if (!email.value || !password.value) {
        errorMessage.value = '이메일과 비밀번호를 모두 입력해주세요.';
        return;
    }

    isSubmitting.value = true;
    errorMessage.value = '';

    try {
        const authData = await login({
            email: email.value,
            password: password.value
        });

        if (!authData?.accessToken || !authData?.refreshToken) {
            throw new Error('서버로부터 올바른 토큰을 받지 못했습니다.');
        }

        saveAuthSession(authData);
        router.push('/home');
    } catch (error) {
        console.error("로그인 에러:", error);
        errorMessage.value = error.message || '로그인에 실패했습니다.';
    } finally {
        isSubmitting.value = false;
    }
};

const startGoogleLogin = () => {
    window.location.href = getGoogleOAuthUrl();
};

const goToSignup = () => {
    router.push('/signup');
};
</script>
