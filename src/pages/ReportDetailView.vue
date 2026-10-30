<template>
  <div class="min-h-screen bg-slate-50 font-sans">

    <!-- Header -->
    <header class="bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm">
      <div class="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button @click="goBack" class="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-brand flex items-center justify-center text-white font-black text-xs">CV</div>
            <span class="font-bold text-slate-800">Career-View</span>
            <span class="text-slate-200 mx-1">·</span>
            <span class="text-sm text-slate-400">면접 리포트 <span class="font-semibold text-slate-600">#{{ sessionId }}</span></span>
          </div>
        </div>
        <button @click="goToHome" class="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-sm font-medium transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          홈으로
        </button>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center h-[calc(100vh-3.5rem)] gap-4">
      <div class="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
      <p class="text-sm font-medium text-slate-400">리포트를 불러오는 중...</p>
    </div>

    <!-- Waiting for AI report -->
    <div v-else-if="isWaitingForReport" class="flex items-center justify-center h-[calc(100vh-3.5rem)] px-6">
      <div class="bg-white rounded-3xl shadow-sm border border-slate-100 w-full max-w-lg p-10 flex flex-col items-center gap-7">

        <!-- Animated icon -->
        <div class="relative w-20 h-20">
          <div class="absolute inset-0 rounded-full border-4 border-brand/15"></div>
          <div class="absolute inset-0 rounded-full border-4 border-transparent border-t-brand animate-spin"></div>
          <div class="absolute inset-2 rounded-full bg-brand/5 flex items-center justify-center">
            <svg class="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
        </div>

        <!-- Title -->
        <div class="text-center">
          <h2 class="text-lg font-bold text-slate-800 mb-1">AI 리포트 생성 중</h2>
          <p class="text-sm text-slate-400 break-keep leading-relaxed">면접 데이터를 종합 분석하여 맞춤형 리포트를 작성하고 있습니다.</p>
        </div>

        <!-- Progress bar -->
        <div class="w-full space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="font-medium text-slate-500 transition-all duration-500">{{ waitMessage }}</span>
            <span class="font-bold text-brand tabular-nums">{{ waitProgress }}%</span>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              class="h-2.5 rounded-full bg-gradient-to-r from-brand to-brandHover transition-all duration-700 ease-out"
              :style="{ width: waitProgress + '%' }"
            ></div>
          </div>
        </div>

        <!-- Steps -->
        <div class="w-full space-y-2">
          <div v-for="step in WAIT_STEPS" :key="step.threshold" class="flex items-center gap-3">
            <div class="shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300"
              :class="waitProgress >= step.threshold
                ? 'bg-brand'
                : 'bg-slate-100'"
            >
              <svg v-if="waitProgress >= step.threshold" class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <div v-else class="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
            </div>
            <span class="text-xs transition-colors duration-300"
              :class="waitProgress >= step.threshold ? 'text-slate-700 font-medium' : 'text-slate-400'"
            >{{ step.label }}</span>
          </div>
        </div>

        <!-- 수동 재시도 (90초 이상 대기 시 노출) -->
        <transition
          enter-active-class="transition-all duration-500"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
        >
          <div v-if="showManualRetry" class="w-full pt-2 border-t border-slate-100 flex flex-col items-center gap-2">
            <p class="text-xs text-slate-400">시간이 오래 걸리고 있어요. AI 서버 일시 장애일 수 있습니다.</p>
            <button
              @click="retryReport"
              :disabled="isRetrying"
              class="flex items-center gap-1.5 text-sm font-bold text-brand hover:text-brandHover disabled:text-slate-400 transition-colors"
            >
              <svg v-if="isRetrying" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
              <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              {{ isRetrying ? '재시도 요청 중...' : '직접 재시도하기' }}
            </button>
            <p v-if="retryError" class="text-xs text-red-500 break-keep text-center">{{ retryError }}</p>
          </div>
        </transition>

        <p class="text-[11px] text-slate-300">보통 1~2분 소요됩니다. 페이지를 닫아도 괜찮습니다.</p>
      </div>
    </div>

    <!-- Error: general -->
    <div v-else-if="loadError" class="flex flex-col items-center justify-center h-[calc(100vh-3.5rem)] gap-4 px-8 text-center">
      <div class="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
        <svg class="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <div>
        <p class="font-bold text-slate-700 mb-1">리포트를 불러오지 못했습니다</p>
        <p class="text-sm text-slate-400 break-keep">{{ loadError }}</p>
      </div>
      <button @click="loadReport" class="px-5 py-2.5 bg-brand text-white text-sm font-bold rounded-xl shadow-sm hover:bg-brandHover transition-colors">다시 시도</button>
    </div>

    <!-- Error: REPORT_GENERATION_FAILED -->
    <div v-else-if="isReportFailed" class="flex items-center justify-center h-[calc(100vh-3.5rem)] px-6">
      <div class="bg-white rounded-3xl shadow-sm border border-red-100 w-full max-w-md p-10 flex flex-col items-center gap-6 text-center">
        <div class="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
          <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <div>
          <h2 class="text-lg font-bold text-slate-800 mb-2">리포트 생성에 실패했습니다</h2>
          <p class="text-sm text-slate-400 leading-relaxed break-keep">AI 서버 오류로 리포트를 생성하지 못했습니다.<br>재시도 버튼을 누르면 다시 생성을 시도합니다.</p>
        </div>

        <p v-if="retryError" class="text-xs text-red-500 bg-red-50 rounded-xl px-4 py-2.5 w-full break-keep">{{ retryError }}</p>

        <button
          @click="retryReport"
          :disabled="isRetrying"
          class="w-full py-3.5 bg-brand hover:bg-brandHover disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
        >
          <svg v-if="isRetrying" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          {{ isRetrying ? 'AI 재분석 요청 중...' : '리포트 재생성 요청' }}
        </button>
        <button @click="goToHome" class="text-sm text-slate-400 hover:text-slate-600 transition-colors">홈으로 돌아가기</button>
      </div>
    </div>

    <!-- Main content -->
    <main v-else-if="report" class="max-w-7xl mx-auto px-6 py-8 space-y-6 pb-20">

      <!-- 1. Score Overview -->
      <div class="grid grid-cols-4 gap-5">

        <!-- Main score ring -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
          <div class="flex items-start justify-between mb-2">
            <div>
              <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">종합 점수</p>
              <p class="text-[11px] text-slate-300 mt-0.5">{{ formatDate(report.createTime) }}</p>
            </div>
            <span class="px-3 py-1 text-xs font-bold rounded-full" :class="gradeClass">{{ gradeLabel }}</span>
          </div>
          <div class="flex-1 flex items-center justify-center my-3">
            <div class="relative">
              <svg width="148" height="148" viewBox="0 0 148 148">
                <circle cx="74" cy="74" r="62" fill="none" stroke="#f1f5f9" stroke-width="12"/>
                <circle cx="74" cy="74" r="62" fill="none" stroke="url(#mainGrad)" stroke-width="12"
                  stroke-linecap="round"
                  :stroke-dasharray="389.6"
                  :stroke-dashoffset="389.6 * (1 - (report.totalScore ?? 0) / 100)"
                  transform="rotate(-90 74 74)"
                  style="transition: stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)"
                />
                <defs>
                  <linearGradient id="mainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#6366f1"/>
                    <stop offset="100%" stop-color="#818cf8"/>
                  </linearGradient>
                </defs>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-4xl font-black text-slate-800">{{ report.totalScore ?? '-' }}</span>
                <span class="text-xs font-medium text-slate-400">/ 100점</span>
              </div>
            </div>
          </div>
          <p class="text-[11px] text-slate-300 text-center">세션 #{{ sessionId }}</p>
        </div>

        <!-- Content score -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col items-center justify-center gap-3">
          <div class="relative">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#eff6ff" stroke-width="10"/>
              <circle cx="50" cy="50" r="42" fill="none" stroke="#3b82f6" stroke-width="10"
                stroke-linecap="round"
                :stroke-dasharray="263.9"
                :stroke-dashoffset="263.9 * (1 - (aiAnalysis.contentScore ?? 0) / 100)"
                transform="rotate(-90 50 50)"
                style="transition: stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)"
              />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-2xl font-black text-slate-700">{{ aiAnalysis.contentScore ?? '-' }}</span>
            </div>
          </div>
          <div class="text-center">
            <p class="text-sm font-bold text-slate-700">내용 점수</p>
            <p class="text-[11px] text-slate-400 mt-0.5">답변 구성 & 정확도</p>
          </div>
        </div>

        <!-- Voice score -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col items-center justify-center gap-3">
          <div class="relative">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#f5f3ff" stroke-width="10"/>
              <circle cx="50" cy="50" r="42" fill="none" stroke="#8b5cf6" stroke-width="10"
                stroke-linecap="round"
                :stroke-dasharray="263.9"
                :stroke-dashoffset="263.9 * (1 - (aiAnalysis.voiceScore ?? 0) / 100)"
                transform="rotate(-90 50 50)"
                style="transition: stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)"
              />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-2xl font-black text-slate-700">{{ aiAnalysis.voiceScore ?? '-' }}</span>
            </div>
          </div>
          <div class="text-center">
            <p class="text-sm font-bold text-slate-700">음성 점수</p>
            <p class="text-[11px] text-slate-400 mt-0.5">발화 품질 & 속도</p>
          </div>
        </div>

        <!-- Expression score -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col items-center justify-center gap-3">
          <div class="relative">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#ecfdf5" stroke-width="10"/>
              <circle cx="50" cy="50" r="42" fill="none" stroke="#10b981" stroke-width="10"
                stroke-linecap="round"
                :stroke-dasharray="263.9"
                :stroke-dashoffset="263.9 * (1 - (aiAnalysis.expressionScore ?? 0) / 100)"
                transform="rotate(-90 50 50)"
                style="transition: stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)"
              />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-2xl font-black text-slate-700">{{ aiAnalysis.expressionScore ?? '-' }}</span>
            </div>
          </div>
          <div class="text-center">
            <p class="text-sm font-bold text-slate-700">표정 점수</p>
            <p class="text-[11px] text-slate-400 mt-0.5">감정 안정성 & 인상</p>
          </div>
        </div>

      </div>

      <!-- 2. AI Summary + Final Advice -->
      <div class="grid grid-cols-5 gap-5">

        <div class="col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-7 h-7 bg-brand/10 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
              </svg>
            </div>
            <h3 class="text-sm font-bold text-slate-700">AI 종합 요약</h3>
          </div>
          <p class="text-sm text-slate-600 leading-relaxed break-keep">
            {{ aiAnalysis.overallSummary || report.feedback || '분석 중입니다.' }}
          </p>
        </div>

        <div class="col-span-2 bg-brand/5 border border-brand/10 rounded-2xl p-6">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-7 h-7 bg-brand/15 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <h3 class="text-sm font-bold text-brand">AI 최종 조언</h3>
          </div>
          <p class="text-sm text-slate-600 leading-relaxed break-keep">
            {{ aiAnalysis.finalAdvice || '분석이 완료되면 최종 조언이 표시됩니다.' }}
          </p>
        </div>

      </div>

      <!-- 3. Strengths & Weaknesses -->
      <div v-if="parsedStrengths.length || parsedWeaknesses.length" class="grid grid-cols-2 gap-5">

        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 class="text-sm font-bold text-slate-700">강점</h3>
            <span class="ml-auto text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{{ parsedStrengths.length }}개</span>
          </div>
          <div class="space-y-3">
            <div v-for="(s, i) in parsedStrengths" :key="i" class="flex gap-3 p-3 bg-emerald-50/50 rounded-xl">
              <div class="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <svg class="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div>
                <p class="text-sm font-bold text-slate-700">{{ s.title }}</p>
                <p class="text-xs text-slate-500 mt-0.5 leading-relaxed break-keep">{{ s.detail }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <h3 class="text-sm font-bold text-slate-700">개선점</h3>
            <span class="ml-auto text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{{ parsedWeaknesses.length }}개</span>
          </div>
          <div class="space-y-3">
            <div v-for="(w, i) in parsedWeaknesses" :key="i" class="p-3 bg-amber-50/40 rounded-xl border border-amber-100/60">
              <p class="text-sm font-bold text-slate-700">{{ w.title }}</p>
              <p class="text-xs text-slate-500 mt-1 leading-relaxed break-keep">{{ w.detail }}</p>
              <div v-if="w.improvement" class="mt-2 flex gap-1.5 items-start">
                <span class="text-amber-500 text-xs shrink-0 mt-0.5">💡</span>
                <p class="text-xs text-amber-700 font-medium leading-relaxed break-keep">{{ w.improvement }}</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- 4. Time-based Insights -->
      <div v-if="aiAnalysis.timeBasedInsights?.length" class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div class="flex items-center gap-2 mb-5">
          <div class="w-7 h-7 bg-sky-50 rounded-lg flex items-center justify-center">
            <svg class="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h3 class="text-sm font-bold text-slate-700">시간대별 분석</h3>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div v-for="(insight, i) in aiAnalysis.timeBasedInsights" :key="i" class="p-4 bg-sky-50/40 rounded-xl border border-sky-100/60">
            <span class="inline-block px-2.5 py-1 bg-sky-100 text-sky-700 text-[11px] font-bold rounded-lg mb-2">{{ insight.timeRange }}</span>
            <p class="text-sm text-slate-600 leading-relaxed break-keep mb-2">{{ insight.observation }}</p>
            <p v-if="insight.suggestion" class="text-xs text-sky-600 font-medium leading-relaxed break-keep">→ {{ insight.suggestion }}</p>
          </div>
        </div>
      </div>

      <!-- 5. Per-question Analysis -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 bg-brand/10 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 class="text-sm font-bold text-slate-700">질문별 상세 분석</h3>
          </div>
          <span v-if="questions.length" class="text-xs font-bold text-brand bg-brandLight/50 px-3 py-1 rounded-full">총 {{ questions.length }}문항</span>
        </div>

        <div class="space-y-3">
          <div
            v-for="(q, idx) in questions"
            :key="q.qId ?? idx"
            class="bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200"
            :class="isExpanded(idx) ? 'border-brand/20' : 'border-slate-100'"
          >
            <!-- Collapsed header -->
            <button
              @click="toggleQuestion(idx)"
              class="w-full text-left p-5 flex items-start gap-4 hover:bg-slate-50/70 transition-colors"
            >
              <span class="shrink-0 px-2.5 py-1 bg-brand/10 text-brand text-xs font-black rounded-lg mt-0.5">Q{{ idx + 1 }}</span>
              <p class="flex-1 text-sm font-semibold text-slate-700 leading-snug break-keep">{{ q.question }}</p>
              <div class="shrink-0 flex items-center gap-2 ml-2">
                <span v-if="q.totalScore != null" class="text-xs font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">{{ q.totalScore }}점</span>
                <svg
                  class="w-4 h-4 text-slate-400 transition-transform duration-200"
                  :class="isExpanded(idx) ? 'rotate-180' : ''"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </button>

            <!-- Expanded detail -->
            <div v-if="isExpanded(idx)" class="border-t border-slate-100 p-5 space-y-5">

              <!-- Mini score breakdown -->
              <div class="grid grid-cols-4 gap-3">
                <div
                  v-for="item in [
                    { label: '종합', score: q.totalScore, bg: 'bg-slate-50', bar: 'bg-slate-500' },
                    { label: '내용', score: q.contentScore, bg: 'bg-blue-50', bar: 'bg-blue-400' },
                    { label: '음성', score: q.voiceScore, bg: 'bg-purple-50', bar: 'bg-purple-400' },
                    { label: '표정', score: q.expressionScore, bg: 'bg-emerald-50', bar: 'bg-emerald-400' },
                  ]"
                  :key="item.label"
                  :class="['rounded-xl p-3', item.bg]"
                >
                  <p class="text-[11px] font-bold text-slate-500 mb-1.5">{{ item.label }}</p>
                  <p class="text-2xl font-black text-slate-800 mb-2">{{ item.score ?? '-' }}</p>
                  <div class="w-full bg-white/70 rounded-full h-1.5">
                    <div :class="['h-1.5 rounded-full transition-all duration-700', item.bar]" :style="{ width: (item.score ?? 0) + '%' }"></div>
                  </div>
                </div>
              </div>

              <!-- Response time -->
              <div v-if="q.responseTimeSeconds" class="flex items-center gap-1.5 text-xs text-slate-400">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                답변 소요 시간:
                <span class="font-semibold text-slate-600">{{ formatSeconds(q.responseTimeSeconds) }}</span>
              </div>

              <!-- Answer transcript -->
              <div v-if="q.answer" class="bg-slate-50 rounded-xl p-4">
                <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">답변 대본 (STT)</p>
                <p class="text-sm text-slate-600 leading-relaxed break-keep">{{ q.answer }}</p>
              </div>

              <!-- Overall feedback -->
              <div v-if="q.feedback" class="bg-brand/5 border border-brand/10 rounded-xl p-4">
                <p class="text-[11px] font-bold text-brand uppercase tracking-wider mb-2">종합 피드백</p>
                <p class="text-sm text-slate-600 leading-relaxed break-keep">{{ q.feedback }}</p>
              </div>

              <!-- Detailed feedbacks -->
              <div v-if="q.contentFeedback || q.voiceFeedback || q.expressionFeedback" class="grid grid-cols-3 gap-3">
                <div v-if="q.contentFeedback" class="bg-blue-50 rounded-xl p-3">
                  <p class="text-[11px] font-bold text-blue-600 mb-1.5">내용 피드백</p>
                  <p class="text-xs text-slate-600 leading-relaxed break-keep">{{ q.contentFeedback }}</p>
                </div>
                <div v-if="q.voiceFeedback" class="bg-purple-50 rounded-xl p-3">
                  <p class="text-[11px] font-bold text-purple-600 mb-1.5">음성 피드백</p>
                  <p class="text-xs text-slate-600 leading-relaxed break-keep">{{ q.voiceFeedback }}</p>
                </div>
                <div v-if="q.expressionFeedback" class="bg-emerald-50 rounded-xl p-3">
                  <p class="text-[11px] font-bold text-emerald-600 mb-1.5">표정 피드백</p>
                  <p class="text-xs text-slate-600 leading-relaxed break-keep">{{ q.expressionFeedback }}</p>
                </div>
              </div>

            </div>
          </div>

          <div v-if="!questions.length" class="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
            <p class="text-sm text-slate-400">질문 분석 결과가 없습니다.</p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <p class="text-[11px] text-slate-300 text-center tracking-widest uppercase pt-4">Career-View Analytics Platform</p>

    </main>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getInterviewReport, getInterviewResult, retryInterviewReport } from '../api/interview';

const router = useRouter();
const route = useRoute();

const sessionId = computed(() => route.params.sessionId);
const report = ref(null);
const resultData = ref(null);
const isLoading = ref(false);
const loadError = ref('');
const expandedSet = ref(new Set());

const isWaitingForReport = ref(false);
const isReportFailed = ref(false);
const isRetrying = ref(false);
const retryError = ref('');
const showManualRetry = ref(false);
const waitProgress = ref(0);
const waitMessage = ref('');
let pollInterval = null;
let progressInterval = null;
let manualRetryTimeout = null;
let waitStartTime = 0;

const WAIT_STEPS = [
  { threshold: 0,  label: '분석 준비 중' },
  { threshold: 20, label: '음성 특징 분석' },
  { threshold: 45, label: '답변 내용 평가' },
  { threshold: 70, label: '표정·감정 데이터 종합' },
  { threshold: 88, label: '최종 리포트 생성' },
];

const resolveWaitMessage = (progress) => {
  return [...WAIT_STEPS].reverse().find(s => progress >= s.threshold)?.label + '...' || '준비 중...';
};

const stopWaiting = () => {
  if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
  if (progressInterval) { clearInterval(progressInterval); progressInterval = null; }
  if (manualRetryTimeout) { clearTimeout(manualRetryTimeout); manualRetryTimeout = null; }
};

const startWaiting = () => {
  isWaitingForReport.value = true;
  isReportFailed.value = false;
  showManualRetry.value = false;
  waitProgress.value = 0;
  waitMessage.value = resolveWaitMessage(0);
  waitStartTime = Date.now();

  // 90초 이상 대기 시 수동 재시도 버튼 노출
  manualRetryTimeout = setTimeout(() => { showManualRetry.value = true; }, 90_000);

  // 시간 기반 진행률: 35초 기준 지수 곡선으로 95%까지 채움
  progressInterval = setInterval(() => {
    const elapsed = (Date.now() - waitStartTime) / 1000;
    const next = Math.min(95, Math.round(95 * (1 - Math.exp(-elapsed / 35))));
    waitProgress.value = next;
    waitMessage.value = resolveWaitMessage(next);
  }, 600);

  // 5초마다 폴링
  pollInterval = setInterval(async () => {
    try {
      const [reportRes, resultRes] = await Promise.allSettled([
        getInterviewReport(sessionId.value),
        getInterviewResult(sessionId.value),
      ]);

      if (reportRes.status === 'rejected') {
        const code = reportRes.reason?.code;
        if (code === 'REPORT_NOT_READY') return; // 계속 대기
        stopWaiting();
        isWaitingForReport.value = false;
        if (code === 'REPORT_GENERATION_FAILED') {
          isReportFailed.value = true;
        } else {
          loadError.value = reportRes.reason?.message || '리포트를 불러오지 못했습니다.';
        }
        return;
      }

      // 완료
      stopWaiting();
      waitProgress.value = 100;
      report.value = reportRes.value;
      if (resultRes.status === 'fulfilled') resultData.value = resultRes.value;
      setTimeout(() => { isWaitingForReport.value = false; }, 400);
    } catch {
      // 네트워크 일시 오류는 무시하고 계속 폴링
    }
  }, 5000);
};

const retryReport = async () => {
  isRetrying.value = true;
  retryError.value = '';
  try {
    await retryInterviewReport(sessionId.value);
    isReportFailed.value = false;
    startWaiting();
  } catch (err) {
    retryError.value = err.message || '재시도 요청에 실패했습니다. 잠시 후 다시 시도해주세요.';
  } finally {
    isRetrying.value = false;
  }
};

const aiAnalysis = computed(() => {
  try { return JSON.parse(report.value?.aiAnalysisJson ?? '{}'); }
  catch { return {}; }
});

const parsedStrengths = computed(() => {
  try {
    const raw = report.value?.strengths;
    return raw ? JSON.parse(raw) : (aiAnalysis.value.strengths ?? []);
  } catch { return []; }
});

const parsedWeaknesses = computed(() => {
  try {
    const raw = report.value?.weaknesses;
    return raw ? JSON.parse(raw) : (aiAnalysis.value.weaknesses ?? []);
  } catch { return []; }
});

const questions = computed(() => {
  const details = resultData.value?.details ?? [];
  const qFeedbacks = aiAnalysis.value.questionFeedbacks ?? [];
  return details.map((d, i) => {
    const qf = qFeedbacks.find(f => f.index === d.qId) ?? qFeedbacks[i] ?? {};
    return {
      ...d,
      totalScore: d.totalScore ?? qf.totalScore ?? null,
      contentScore: d.contentScore ?? qf.contentScore ?? null,
      voiceScore: d.voiceScore ?? qf.voiceScore ?? null,
      expressionScore: d.expressionScore ?? qf.expressionScore ?? null,
      feedback: d.feedback ?? qf.overallFeedback ?? null,
      contentFeedback: d.contentFeedback ?? qf.contentFeedback ?? null,
      voiceFeedback: d.voiceFeedback ?? qf.voiceFeedback ?? null,
      expressionFeedback: d.expressionFeedback ?? qf.expressionFeedback ?? null,
    };
  });
});

const gradeLabel = computed(() => {
  const s = report.value?.totalScore;
  if (s == null) return '-';
  if (s >= 90) return '최우수';
  if (s >= 80) return '우수';
  if (s >= 70) return '양호';
  if (s >= 60) return '보통';
  return '노력 필요';
});

const gradeClass = computed(() => {
  const s = report.value?.totalScore;
  if (s == null) return 'bg-slate-100 text-slate-400';
  if (s >= 90) return 'bg-brand text-white';
  if (s >= 80) return 'bg-emerald-500 text-white';
  if (s >= 70) return 'bg-yellow-400 text-white';
  if (s >= 60) return 'bg-orange-400 text-white';
  return 'bg-red-400 text-white';
});

const formatDate = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatSeconds = (secs) => {
  if (!secs) return '-';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
};

const isExpanded = (idx) => expandedSet.value.has(idx);

const toggleQuestion = (idx) => {
  const next = new Set(expandedSet.value);
  if (next.has(idx)) next.delete(idx);
  else next.add(idx);
  expandedSet.value = next;
};

const loadReport = async () => {
  if (!sessionId.value) {
    loadError.value = '유효하지 않은 리포트입니다.';
    return;
  }

  isLoading.value = true;
  loadError.value = '';

  try {
    const [reportRes, resultRes] = await Promise.allSettled([
      getInterviewReport(sessionId.value),
      getInterviewResult(sessionId.value),
    ]);

    if (reportRes.status === 'fulfilled') {
      report.value = reportRes.value;
    } else {
      const err = reportRes.reason;
      if (err.code === 'REPORT_NOT_READY') {
        isLoading.value = false;
        startWaiting();
        return;
      }
      if (err.code === 'REPORT_GENERATION_FAILED') {
        isReportFailed.value = true;
        return;
      }
      loadError.value = err.message || '리포트를 불러오지 못했습니다.';
      return;
    }

    if (resultRes.status === 'fulfilled') {
      resultData.value = resultRes.value;
    }
  } catch (error) {
    loadError.value = error.message || '리포트를 불러오지 못했습니다.';
  } finally {
    isLoading.value = false;
  }
};

const goBack = () => { stopWaiting(); router.back(); };
const goToHome = () => { stopWaiting(); router.push('/home'); };

onMounted(loadReport);
onUnmounted(stopWaiting);
</script>
