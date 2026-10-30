<template>
  <div class="bg-slate-50 min-h-screen flex items-center justify-center p-4">
    <div class="bg-white shadow-2xl rounded-[2.5rem] flex flex-col max-w-sm w-full overflow-hidden h-[85vh] sm:h-[90vh] relative">

      <div class="w-full px-6 pt-8 pb-4 flex justify-between items-center bg-white sticky top-0 z-20">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 bg-brand rounded-lg flex items-center justify-center text-white">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          </div>
          <h1 class="text-xl font-bold text-slate-800 tracking-tight">면접 리포트</h1>
        </div>

        <button @click="goToHome" class="p-2.5 bg-slate-50 rounded-full hover:bg-brandLight hover:text-brand text-slate-400 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
        </button>
      </div>

      <div class="px-6 py-4 bg-brandBg/50 border-b border-brandLight/30">
        <div class="flex items-center gap-4">
          <div class="flex-1">
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">전체 면접 횟수</p>
            <p class="text-2xl font-black text-slate-800">{{ totalReportCount }}회</p>
          </div>
          <div class="flex-1">
            <p class="text-[10px] text-brand font-bold uppercase tracking-wider mb-1">평균 점수</p>
            <p class="text-2xl font-black text-brand">{{ averageScoreLabel }}</p>
          </div>
        </div>
      </div>

      <div class="flex-grow overflow-y-auto px-6 py-4 space-y-4 hide-scrollbar bg-slate-50/30">

        <div v-if="isLoading" class="bg-white border-2 border-slate-100 p-5 rounded-3xl text-center">
          <p class="text-sm font-bold text-slate-700">리포트를 불러오는 중입니다.</p>
        </div>

        <div v-else-if="loadError" class="bg-white border-2 border-red-100 p-5 rounded-3xl text-center">
          <p class="text-sm font-bold text-red-500 break-keep">{{ loadError }}</p>
        </div>

        <div v-else-if="reports.length === 0" class="bg-white border-2 border-slate-100 p-5 rounded-3xl text-center">
          <p class="text-sm font-bold text-slate-700">아직 완료된 면접 리포트가 없습니다.</p>
        </div>

        <template v-else>
          <div
            v-for="report in reports"
            :key="report.sessionId"
            @click="viewDetail(report)"
            class="bg-white border-2 p-4 rounded-3xl shadow-sm transition-all transform"
            :class="{
              'border-slate-100 hover:border-brand/40 cursor-pointer group active:scale-95': report.status !== 'failed',
              'border-red-100 bg-red-50/30 cursor-default': report.status === 'failed',
            }"
          >
            <div class="flex justify-between items-start mb-3">
              <div>
                <span class="text-[10px] font-bold text-slate-400 block mb-1">{{ formatDate(report.createTime) }}</span>
                <h3 class="text-sm font-bold tracking-tight transition-colors"
                  :class="report.status === 'failed' ? 'text-red-700' : 'text-slate-800 group-hover:text-brand'"
                >
                  면접 #{{ report.sessionId }} 리포트
                </h3>
              </div>
              <span class="px-2.5 py-1 text-[10px] font-bold rounded-lg shrink-0" :class="{
                'bg-brand text-white shadow-sm': report.status === 'ready',
                'bg-slate-100 text-slate-400': report.status === 'pending',
                'bg-red-100 text-red-500': report.status === 'failed',
              }">
                {{ report.status === 'ready' ? `${report.totalScore ?? '-'}점` : report.status === 'failed' ? '생성 실패' : '준비중' }}
              </span>
            </div>

            <div class="flex items-center gap-4 border-t pt-3"
              :class="report.status === 'failed' ? 'border-red-100' : 'border-slate-50'"
            >
              <div class="flex items-center gap-1.5 min-w-0 flex-1">
                <svg class="w-3.5 h-3.5 shrink-0"
                  :class="report.status === 'failed' ? 'text-red-300' : 'text-slate-300'"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <span class="text-[11px] font-medium truncate"
                  :class="report.status === 'failed' ? 'text-red-400' : 'text-slate-500'"
                >{{ report.summary }}</span>
              </div>

              <!-- 재시도 버튼 (failed 상태에만 노출) -->
              <button
                v-if="report.status === 'failed'"
                @click.stop="retryReport(report.sessionId)"
                :disabled="retryingIds.has(report.sessionId)"
                class="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-brand hover:bg-brandHover disabled:bg-slate-200 disabled:text-slate-400 text-white text-[11px] font-bold rounded-xl transition-colors"
              >
                <svg v-if="retryingIds.has(report.sessionId)" class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
                <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                {{ retryingIds.has(report.sessionId) ? '요청 중...' : '재시도' }}
              </button>
            </div>

            <!-- 재시도 에러 메시지 -->
            <p v-if="report.retryError" class="mt-2 text-[11px] text-red-400 break-keep">{{ report.retryError }}</p>
          </div>
        </template>

      </div>

      <div class="p-6 bg-white border-t border-slate-50 text-center">
        <p class="text-[10px] text-slate-300 font-medium tracking-widest uppercase">Career-View Analytics Platform</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getInterviewHistory, getInterviewReport, retryInterviewReport } from '../api/interview';

const router = useRouter();
const route = useRoute();

const reports = ref([]);
const isLoading = ref(false);
const loadError = ref('');
const retryingIds = ref(new Set());

const totalReportCount = computed(() => reports.value.length);
const averageScoreLabel = computed(() => {
    const readyReports = reports.value.filter((report) => Number.isFinite(report.totalScore));
    if (!readyReports.length) return '-';

    const totalScore = readyReports.reduce((sum, report) => sum + report.totalScore, 0);
    return `${Math.round(totalScore / readyReports.length)}점`;
});

const goToHome = () => {
    router.push('/home');
};

const normalizeReport = (sessionId, report = null, error = null) => {
    const code = error?.code;
    const status = report ? 'ready' : code === 'REPORT_GENERATION_FAILED' ? 'failed' : 'pending';
    return {
        sessionId,
        createTime: report?.createTime || '',
        totalScore: Number.isFinite(report?.totalScore) ? report.totalScore : null,
        feedback: report?.feedback || '',
        status,
        isReady: status === 'ready',
        summary: status === 'failed'
            ? 'AI 서버 오류로 생성에 실패했습니다'
            : status === 'pending'
                ? 'AI 리포트 생성 대기 중'
                : report?.feedback || '분석 결과를 확인할 수 있습니다.',
        retryError: '',
    };
};

const formatDate = (value) => {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';

    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).replace(/\s/g, '');
};

const fetchReportSafely = async (sessionId) => {
    try {
        const report = await getInterviewReport(sessionId);
        return normalizeReport(sessionId, report);
    } catch (error) {
        console.warn(`리포트 조회 실패 (${sessionId}):`, error);
        return normalizeReport(sessionId, null, error);
    }
};

const loadReports = async () => {
    isLoading.value = true;
    loadError.value = '';

    try {
        const history = await getInterviewHistory();
        const sessionIds = [...new Set([
            ...(route.query.sessionId ? [Number(route.query.sessionId)] : []),
            ...(history?.sessionIds || [])
        ])].filter(Boolean);

        reports.value = await Promise.all(sessionIds.map(fetchReportSafely));
    } catch (error) {
        console.error('면접 히스토리 조회 실패:', error);
        loadError.value = error.message || '면접 히스토리를 불러오지 못했습니다.';
    } finally {
        isLoading.value = false;
    }
};

const viewDetail = (report) => {
    if (report.status === 'failed') return;
    router.push(`/report/${report.sessionId}`);
};

const retryReport = async (sessionId) => {
    const next = new Set(retryingIds.value);
    next.add(sessionId);
    retryingIds.value = next;

    try {
        await retryInterviewReport(sessionId);
        reports.value = reports.value.map((r) =>
            r.sessionId === sessionId
                ? { ...r, status: 'pending', summary: 'AI 리포트 재생성 중', retryError: '' }
                : r
        );
    } catch (err) {
        reports.value = reports.value.map((r) =>
            r.sessionId === sessionId
                ? { ...r, retryError: err.message || '재시도 요청에 실패했습니다.' }
                : r
        );
    } finally {
        const done = new Set(retryingIds.value);
        done.delete(sessionId);
        retryingIds.value = done;
    }
};

onMounted(loadReports);
</script>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
