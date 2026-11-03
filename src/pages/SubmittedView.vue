<template>
  <div class="bg-slate-50 min-h-screen flex items-center justify-center p-4">
    <div class="bg-white shadow-2xl rounded-[2.5rem] max-w-sm w-full p-8 text-center">
      <h2 class="text-2xl font-bold text-slate-800 mb-3">고생하셨습니다</h2>
      <p class="text-sm text-slate-500 mb-8">채점 결과는 홈 화면에서 단계별로 확인할 수 있습니다.</p>
      <button @click="router.push('/home')" class="w-full bg-brand text-white font-bold rounded-xl py-3 text-sm">홈으로</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();
</script>
