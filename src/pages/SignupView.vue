<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-ground px-4 py-10">
    <div class="w-full max-w-[400px]">
      <div class="mb-8"><BrandMark size="lg" /></div>

      <div class="rounded-card border border-line bg-surface p-6 sm:p-8">
        <h1 class="text-[24px] font-semibold leading-8 tracking-[-0.02em] text-ink">회원가입</h1>

        <form class="mt-6" @submit.prevent="handleSignup">
          <div class="mb-4">
            <label for="name" class="field-label">이름</label>
            <input v-model="name" type="text" id="name" class="field-input" autocomplete="name" :disabled="isSubmitting" required>
          </div>

          <div class="mb-4">
            <label for="email" class="field-label">이메일</label>
            <input v-model="email" type="email" id="email" class="field-input" autocomplete="email" :disabled="isSubmitting" required>
          </div>

          <div class="mb-4">
            <label for="password" class="field-label">비밀번호</label>
            <input v-model="password" type="password" id="password" class="field-input" autocomplete="new-password" :disabled="isSubmitting" required>
            <p class="field-hint">영문, 숫자 포함 8자 이상</p>
          </div>

          <div class="mb-5">
            <label for="passwordConfirm" class="field-label">비밀번호 확인</label>
            <input v-model="passwordConfirm" type="password" id="passwordConfirm" class="field-input" autocomplete="new-password" :disabled="isSubmitting" required>
          </div>

          <div class="mb-5 flex items-start gap-2">
            <input v-model="terms" id="terms" type="checkbox" class="mt-[3px] h-4 w-4 shrink-0 accent-primary" :disabled="isSubmitting" required>
            <label for="terms" class="text-[14px] leading-snug text-muted">
              <a href="#" class="link-text">이용약관</a> 및 <a href="#" class="link-text">개인정보 처리방침</a>에 동의합니다.
            </label>
          </div>

          <p v-if="errorMessage" class="field-error mb-3" role="alert">{{ errorMessage }}</p>

          <button type="submit" :disabled="isSubmitting" class="btn-primary">
            {{ isSubmitting ? '가입 중...' : '가입하기' }}
          </button>
        </form>

        <div class="my-5 border-t border-rule"></div>

        <button type="button" @click="startGoogleLogin" :disabled="isSubmitting" class="btn-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google 계정으로 가입하기
        </button>
      </div>

      <p class="mt-5 text-center text-[14px] text-muted">
        이미 계정이 있으신가요?
        <a href="#" @click.prevent="goToLogin" class="link-text ml-1">로그인</a>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import BrandMark from '../components/ui/BrandMark.vue';
import { getGoogleOAuthUrl, saveAuthSession, signup } from '../api/auth';

// 입력 변수들 준비
const name = ref('');
const email = ref('');
const password = ref('');
const passwordConfirm = ref('');
const terms = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref('');

const router = useRouter();

// 회원가입 버튼 눌렀을 때
const handleSignup = async () => {
    errorMessage.value = '';

    // 1. 비밀번호가 서로 같은지 검사
    if (password.value !== passwordConfirm.value) {
        errorMessage.value = '비밀번호가 서로 일치하지 않습니다.';
        return; 
    }

    if (!terms.value) {
        errorMessage.value = '이용약관 및 개인정보 처리방침에 동의해주세요.';
        return;
    }

    isSubmitting.value = true;

    try {
        const authData = await signup({
            name: name.value,
            email: email.value,
            password: password.value
        });

        if (!authData?.accessToken || !authData?.refreshToken) {
            throw new Error('서버로부터 올바른 토큰을 받지 못했습니다.');
        }

        saveAuthSession(authData);
        router.push('/home');
    } catch (error) {
        console.error('회원가입 에러:', error);
        errorMessage.value = error.message || '회원가입에 실패했습니다.';
    } finally {
        isSubmitting.value = false;
    }
};

const startGoogleLogin = () => {
    window.location.href = getGoogleOAuthUrl();
};

// 하단 '로그인' 글자 눌렀을 때
const goToLogin = () => {
    router.push('/login'); // 로그인 화면으로 돌아가기
};
</script>
