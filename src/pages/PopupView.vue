<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

function goToHome() {
  router.push('/home');
}

function goToReport() {
  router.push('/report');
}
</script>

<template>
  <main class="bg-gray-200 h-screen w-full font-sans overflow-hidden">
    <div id="resultModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity">
            
            <div class="bg-white rounded-[24px] shadow-2xl w-11/12 max-w-2xl overflow-hidden flex flex-col transform transition-all scale-100">
                
                <div class="bg-brandLight/40 px-8 py-6 border-b border-brandLight/60 flex justify-between items-center">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white text-xl shadow-sm">
                            🎉
                        </div>
                        <div>
                            <h2 class="text-xl font-bold text-gray-800">모의 면접 완료!</h2>
                            <p class="text-xs text-gray-500 font-medium mt-0.5">Career-View 실시간 AI 분석 결과</p>
                        </div>
                    </div>
                    <button @click="goToHome" class="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
    
                <div class="p-8 space-y-8 bg-white">
                    
                    <div>
                        <h3 class="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                            <svg class="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            표정 및 심리 상태 지표
                        </h3>
                        <div class="space-y-4">
                            <div>
                                <div class="flex justify-between text-sm mb-1.5">
                                    <span class="font-bold text-gray-700">Stable <span class="text-gray-400 font-medium text-xs ml-1">(안정)</span></span>
                                    <span class="font-bold text-brand">82%</span>
                                </div>
                                <div class="w-full bg-gray-100 rounded-full h-3">
                                    <div class="bg-brand h-3 rounded-full transition-all duration-1000" style="width: 82%"></div>
                                </div>
                            </div>
                            <div>
                                <div class="flex justify-between text-sm mb-1.5">
                                    <span class="font-bold text-gray-700">Nervous <span class="text-gray-400 font-medium text-xs ml-1">(긴장)</span></span>
                                    <span class="font-bold text-red-400">12%</span>
                                </div>
                                <div class="w-full bg-gray-100 rounded-full h-3">
                                    <div class="bg-red-400 h-3 rounded-full transition-all duration-1000" style="width: 12%"></div>
                                </div>
                            </div>
                            <div>
                                <div class="flex justify-between text-sm mb-1.5">
                                    <span class="font-bold text-gray-700">Neutral <span class="text-gray-400 font-medium text-xs ml-1">(무표정)</span></span>
                                    <span class="font-bold text-gray-400">6%</span>
                                </div>
                                <div class="w-full bg-gray-100 rounded-full h-3">
                                    <div class="bg-gray-400 h-3 rounded-full transition-all duration-1000" style="width: 6%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
    
                    <div class="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                        <h3 class="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                            <span class="text-brand">💡</span> AI 종합 코멘트
                        </h3>
                        <p class="text-sm text-gray-600 leading-relaxed break-keep">
                            전반적으로 매우 <strong>안정적(Stable)</strong>인 태도로 면접에 임했습니다. 다만 첫 번째 질문을 받을 때 <strong>긴장(Nervous)</strong> 지표가 일시적으로 상승했습니다. 실전에서는 당황스러운 질문이 나오더라도 가볍게 미소를 지으며 여유를 찾는 연습을 해보세요!
                        </p>
                    </div>
    
                </div>
    
                <div class="bg-gray-50 px-8 py-5 flex justify-end gap-3 border-t border-gray-100">
                    <button @click="goToHome" class="px-6 py-3 rounded-xl font-bold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-700 transition-colors text-sm">
                        홈으로 가기
                    </button>
                    <button @click="goToReport" class="px-6 py-3 rounded-xl font-bold text-white bg-brand hover:bg-brandHover shadow-md shadow-brand/20 transition-colors text-sm flex items-center gap-2">
                        상세 리포트 확인하기
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                </div>
                
            </div>
        </div>
  </main>
</template>
