<template>
  <div class="bg-gray-50 h-screen flex flex-col font-sans overflow-hidden">
    <header
      class="w-full h-16 bg-brandLight/40 flex items-center justify-between px-8 border-b border-brandLight/60 shrink-0"
    >
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white font-bold">CV</div>
        <h1 class="text-lg font-bold text-gray-800">
          Career-View <span class="text-sm font-normal text-gray-500 ml-2">실시간 모의 면접 진행 중</span>
        </h1>
      </div>

      <div class="flex items-center gap-6">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          <span class="text-xl font-mono font-semibold text-gray-800">{{ formattedTime }}</span>
        </div>
        <button
          @click="finishInterview"
          class="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-bold transition-colors duration-200"
        >
          면접 종료
        </button>
      </div>
    </header>

    <main class="flex-1 relative overflow-hidden bg-black">
      <!-- 카메라 피드 (전체 화면) -->
      <video
        ref="videoRef"
        autoplay
        playsinline
        class="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
      ></video>

      <!-- 카메라 없음 오버레이 -->
      <div
        v-if="!isCameraReady"
        class="absolute inset-0 bg-gray-950 text-white flex flex-col items-center justify-center px-8 text-center"
      >
        <div class="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center mb-5">
          <svg class="w-8 h-8 text-brandLight" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.8"
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            ></path>
          </svg>
        </div>
        <h2 class="text-xl font-bold mb-2">카메라 없이 진행 중</h2>
        <p class="text-sm text-gray-300 leading-relaxed break-keep">
          질문 답변은 계속 진행할 수 있으며, 실시간 표정 분석만 제외됩니다.
        </p>
      </div>

      <!-- 좌상단: 감정 분석 패널 -->
      <div
        class="absolute top-4 left-4 bg-black/50 backdrop-blur-md rounded-2xl px-3.5 py-3 border border-white/10 min-w-[88px]"
      >
        <p class="text-sm font-bold text-white/50 uppercase tracking-widest mb-2.5">감정 분석</p>
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="relative flex h-2.5 w-2.5 shrink-0">
              <span
                v-if="currentEmotion === 'Stable'"
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"
              ></span>
              <span
                class="relative inline-flex rounded-full h-2.5 w-2.5 transition-colors duration-300"
                :class="currentEmotion === 'Stable' ? 'bg-brand' : 'bg-white/20'"
              ></span>
            </span>
            <span
              class="text-sm transition-all duration-300"
              :class="currentEmotion === 'Stable' ? 'font-bold text-brand' : 'font-medium text-white/40'"
              >안정</span
            >
          </div>
          <div class="flex items-center gap-2">
            <span class="relative flex h-2.5 w-2.5 shrink-0">
              <span
                v-if="currentEmotion === 'Neutral'"
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/70 opacity-75"
              ></span>
              <span
                class="relative inline-flex rounded-full h-2.5 w-2.5 transition-colors duration-300"
                :class="currentEmotion === 'Neutral' ? 'bg-white' : 'bg-white/20'"
              ></span>
            </span>
            <span
              class="text-sm transition-all duration-300"
              :class="currentEmotion === 'Neutral' ? 'font-bold text-white' : 'font-medium text-white/40'"
              >무표정</span
            >
          </div>
          <div class="flex items-center gap-2">
            <span class="relative flex h-2.5 w-2.5 shrink-0">
              <span
                v-if="currentEmotion === 'Nervous'"
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"
              ></span>
              <span
                class="relative inline-flex rounded-full h-2.5 w-2.5 transition-colors duration-300"
                :class="currentEmotion === 'Nervous' ? 'bg-red-500' : 'bg-white/20'"
              ></span>
            </span>
            <span
              class="text-sm transition-all duration-300"
              :class="currentEmotion === 'Nervous' ? 'font-bold text-red-400' : 'font-medium text-white/40'"
              >긴장</span
            >
          </div>
        </div>
      </div>

      <!-- 상단 중앙: 현재 질문 -->
      <div class="absolute top-4 left-1/2 -translate-x-1/2 w-[52%] max-w-2xl pointer-events-none">
        <div class="bg-black/55 backdrop-blur-md rounded-2xl px-5 py-3.5 border border-white/10 shadow-xl">
          <div class="flex items-start gap-3">
            <span class="shrink-0 mt-0.5 px-2 py-0.5 bg-brand text-white text-sm font-black rounded-md">
              Q{{ questionIndex }}/{{ totalQuestions }}
            </span>
            <p class="text-base font-semibold text-white leading-relaxed break-keep">{{ currentQuestion }}</p>
          </div>
        </div>
      </div>

      <!-- 하단 중앙: 경고 + 음성 피드백 -->
      <div
        class="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none w-full max-w-xl px-6"
      >
        <!-- 긴장 감지 경고 -->
        <transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 translate-y-3"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-3"
        >
          <div
            v-if="currentEmotion === 'Nervous'"
            class="bg-black/75 backdrop-blur-md text-white px-5 py-2.5 rounded-full border border-red-500/40 text-base font-medium flex items-center gap-2.5 shadow-lg"
          >
            <span class="text-red-400">⚠️</span>
            긴장이 감지됩니다. 심호흡을 하고 편안하게 답변해 보세요.
          </div>
        </transition>

        <!-- 시스템 경고 (서버 오류 등, 긴장 상태와 중복 방지) -->
        <transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 translate-y-3"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-3"
        >
          <div
            v-if="showWarning && warningMessage && currentEmotion !== 'Nervous'"
            class="bg-black/75 backdrop-blur-md text-yellow-300 px-5 py-2.5 rounded-full border border-yellow-500/30 text-base font-medium shadow-lg"
          >
            {{ warningMessage }}
          </div>
        </transition>

        <!-- 음성 피드백 -->
        <transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 translate-y-3"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-3"
        >
          <div
            v-if="showAudioFeedback"
            class="bg-black/75 backdrop-blur-md px-5 py-2.5 rounded-full border text-base font-medium flex items-center gap-2 shadow-lg"
            :class="audioFeedbackIsGood ? 'border-green-500/40 text-green-300' : 'border-yellow-500/40 text-yellow-300'"
          >
            <svg
              v-if="audioFeedbackIsGood"
              class="w-4 h-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
            <span class="break-keep">{{ audioFeedbackText }}</span>
          </div>
        </transition>
      </div>
    </main>

    <!-- 하단 바 -->
    <footer
      class="w-full h-16 bg-brandLight/40 flex items-center justify-between px-8 border-t border-brandLight/60 shrink-0"
    >
      <p class="text-[15px] text-gray-500">답변을 마치면 오른쪽 버튼을 눌러주세요.</p>
      <button
        @click="handleAnswerButtonClick"
        :disabled="isWaitingForQuestion"
        class="px-6 py-2 bg-brand hover:bg-brandHover text-white rounded-lg font-bold text-base transition-colors duration-200 flex items-center gap-2"
        :class="isWaitingForQuestion ? 'opacity-50 cursor-not-allowed' : ''"
      >
        {{ answerButtonLabel }}
        <svg v-if="!isLastQuestion" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
        </svg>
        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
        </svg>
      </button>
    </footer>

    <div
      v-if="isCameraPermissionModalOpen && !isModalOpen"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-40 px-4"
    >
      <div class="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden">
        <div class="bg-brandLight/40 px-6 py-5 border-b border-brandLight/60 flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white shadow-sm">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              ></path>
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-bold text-gray-800">{{ cameraPermissionTitle }}</h2>
            <p class="text-xs text-gray-500 font-medium mt-0.5">실시간 표정 분석을 위한 선택 권한</p>
          </div>
        </div>

        <div class="p-6">
          <p class="text-sm text-gray-600 leading-relaxed break-keep">
            {{ cameraPermissionMessage }}
          </p>

          <div class="mt-5 p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <p class="text-xs font-bold text-gray-700 mb-2">권한 팝업이 보이지 않는 경우</p>
            <p class="text-xs text-gray-500 leading-relaxed break-keep">
              주소창 왼쪽의 사이트 정보 또는 카메라 아이콘을 눌러 카메라 권한을 허용한 뒤 다시 시도해주세요.
            </p>
          </div>
        </div>

        <div class="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
          <button
            @click="continueWithoutCamera"
            class="px-5 py-3 rounded-xl font-bold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-700 transition-colors text-sm"
          >
            카메라 없이 진행
          </button>
          <button
            @click="requestCameraPermission"
            :disabled="isCameraRequesting"
            class="px-5 py-3 rounded-xl font-bold text-white bg-brand hover:bg-brandHover disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md shadow-brand/20 transition-colors text-sm flex items-center gap-2"
          >
            <svg v-if="isCameraRequesting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            {{ cameraActionLabel }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="isModalOpen"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity"
    >
      <div class="bg-white rounded-[24px] shadow-2xl w-11/12 max-w-2xl overflow-hidden flex flex-col">
        <div class="bg-brandLight/40 px-8 py-6 border-b border-brandLight/60 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white text-xl shadow-sm">
              🎉
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-800">모의 면접 완료!</h2>
              <p class="text-xs text-gray-500 font-medium mt-0.5">Career-View 분석 통계 스코어</p>
            </div>
          </div>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div class="p-8 space-y-8 bg-white">
          <div>
            <h3 class="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              실시간 분석 집계 결과
            </h3>
            <div class="space-y-4">
              <div>
                <div class="flex justify-between text-sm mb-1.5">
                  <span class="font-bold text-gray-700"
                    >Stable <span class="text-gray-400 font-medium text-xs ml-1">(안정)</span></span
                  >
                  <span class="font-bold text-brand">{{ finalScores.stable }}%</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-3">
                  <div
                    class="bg-brand h-3 rounded-full transition-all duration-1000"
                    :style="{ width: finalScores.stable + '%' }"
                  ></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-sm mb-1.5">
                  <span class="font-bold text-gray-700"
                    >Nervous <span class="text-gray-400 font-medium text-xs ml-1">(긴장)</span></span
                  >
                  <span class="font-bold text-red-400">{{ finalScores.nervous }}%</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-3">
                  <div
                    class="bg-red-400 h-3 rounded-full transition-all duration-1000"
                    :style="{ width: finalScores.nervous + '%' }"
                  ></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-sm mb-1.5">
                  <span class="font-bold text-gray-700"
                    >Neutral <span class="text-gray-400 font-medium text-xs ml-1">(무표정)</span></span
                  >
                  <span class="font-bold text-gray-400">{{ finalScores.neutral }}%</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-3">
                  <div
                    class="bg-gray-400 h-3 rounded-full transition-all duration-1000"
                    :style="{ width: finalScores.neutral + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 p-5 rounded-2xl border border-gray-100">
            <h3 class="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span class="text-brand">💡</span> AI 종합 피드백
            </h3>
            <p class="text-sm text-gray-600 leading-relaxed break-keep">
              {{ aiFeedbackComment }}
            </p>
          </div>
        </div>

        <div class="bg-gray-50 px-8 py-5 flex justify-end gap-3 border-t border-gray-100">
          <button
            @click="goToHome"
            class="px-6 py-3 rounded-xl font-bold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-700 transition-colors text-sm"
          >
            홈으로 가기
          </button>
          <button
            @click="goToReport"
            class="px-6 py-3 rounded-xl font-bold text-white bg-brand hover:bg-brandHover shadow-md shadow-brand/20 transition-colors text-sm flex items-center gap-2"
          >
            상세 리포트 확인하기
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router"; // 라우터 기능 추가
import {
  FACE_LANDMARKER_MODEL_URL,
  MEDIAPIPE_WASM_URL,
  USE_SOCKJS_TRANSPORT,
  WS_INTERVIEW_PATH,
  webSocketUrl,
} from "../config/env";
import { getInterviewSetting, updateInterviewSessionStatus } from "../api/interview";

const router = useRouter();
const route = useRoute();

const STOMP_NULL = "\u0000";
const FACE_INPUT_SIZE = 224;
const FACE_INPUT_SHAPE = [1, 3, FACE_INPUT_SIZE, FACE_INPUT_SIZE];
const FACE_MEAN = [0.485, 0.456, 0.406];
const FACE_STD = [0.229, 0.224, 0.225];
const FACE_BBOX_MARGIN = 0.25;
const REALTIME_FRAME_INTERVAL_MS = 800;

const AUDIO_REALTIME_INTERVAL_MS = 1000;
const PAUSE_MIN_MS = 500;
const FILLER_BURST_MAX_MS = 300;
const KOREAN_FILLERS = ["음", "어", "그", "네", "뭐", "아", "저"];

// --- 인터페이스 리액티브 상태 정의 ---
const isModalOpen = ref(false);
const currentEmotion = ref("Stable");
const showWarning = ref(false);
const warningMessage = ref("");
const isCameraReady = ref(false);
const isCameraRequesting = ref(false);
const isCameraPermissionModalOpen = ref(false);
const cameraPermissionTitle = ref("카메라 권한을 허용할까요?");
const cameraPermissionMessage = ref(
  "실시간 표정 분석을 사용하려면 카메라 권한이 필요합니다. 카메라가 없거나 권한을 허용하지 않아도 질문 답변은 그대로 진행할 수 있습니다.",
);

// 백엔드 연동 전송 질문 필드 데이터 구조체
const currentQuestion = ref("AI 서버로부터 면접 질문을 구성하고 있습니다...");
const questionIndex = ref(1);
const totalQuestions = ref(5);
const isWaitingForQuestion = ref(true);
// 세션 시작 시 한 번에 받은 초기 질문 목록 (꼬리물기 질문 생성 전까지 이 목록에서 순차적으로 사용)
const questionList = ref([]);
// AI가 마지막 질문의 답변을 바탕으로 생성한 꼬리물기 질문 단계인지 여부
const isFollowUpQuestion = ref(false);

// 타이머 변수
const timerSeconds = ref(0);
let timerInterval = null;

// 누적 로그 분석용 카운터
const analyticsLog = { Stable: 0, Nervous: 0, Neutral: 0, totalTicks: 0 };
const finalScores = ref({ stable: 0, nervous: 0, neutral: 0 });
const aiFeedbackComment = ref("");

// 음성 분석 리액티브 상태
const isMicReady = ref(false);
const currentTranscript = ref("");

// 음성 실시간 피드백 상태
const audioFeedbackText = ref("");
const audioFeedbackIsGood = ref(true);
const showAudioFeedback = ref(false);
let audioFeedbackTimer = null;

// 하드웨어 미디어 참조 변수
const videoRef = ref(null);
let localStream = null;
let isFinishing = false;
let socket = null;
let imageStreamingInterval = null;
let audioRealtimeInterval = null;
let stompSubscriptionSeq = 0;
let stompConnected = false;
let sockJsOpen = false;
let faceLandmarker = null;
let isFaceLandmarkerLoading = false;
let isFrameProcessing = false;
let facePreprocessCanvas = null;
let audioContext = null;
let audioWorkletNode = null;
let micStream = null;
let micIsStopped = false;
let speechRecognition = null;
let sttStatusInterval = null;
let pendingAudioWindows = [];
let pendingTranscript = "";
let currentInterim = "";
let currentQuestionAnswered = false;
const activeSessionId = ref(String(route.query.sessionId || localStorage.getItem("sessionId") || ""));
const activeUserId = ref(String(localStorage.getItem("userId") || "1"));

// 음성 특징 누적기 — 질문 단위로 리셋
const audioAcc = {
  windows: [],
  pauseSegments: [],
  questionStartMs: 0,
  firstSpeechMs: null,
  inSilence: false,
  silenceStartMs: null,
  shortBursts: 0,
  prevIsSpeaking: false,
};

// --- 타이머 포맷 계산 필드 ---
const formattedTime = computed(() => {
  const mins = String(Math.floor(timerSeconds.value / 60)).padStart(2, "0");
  const secs = String(timerSeconds.value % 60).padStart(2, "0");
  return `${mins}:${secs}`;
});

const cameraActionLabel = computed(() => {
  if (isCameraRequesting.value) return "권한 요청 중...";
  return isCameraReady.value ? "카메라 연결됨" : "카메라 권한 허용";
});

// 꼬리물기 질문(마지막 질문에 대한 AI 후속 질문)까지 답변을 마쳐야 진짜 마지막 질문
const isLastQuestion = computed(() => isFollowUpQuestion.value);
const answerButtonLabel = computed(() => {
  if (isWaitingForQuestion.value) return "질문 준비 중...";
  return isLastQuestion.value ? "답변 완료 / 결과 보기" : "답변 완료 / 다음";
});

// --- 라우터 화면 이동 함수 ---
const goToHome = () => {
  isModalOpen.value = false;
  router.push("/home");
};

const goToReport = () => {
  isModalOpen.value = false;
  if (!activeSessionId.value) {
    router.push("/report");
    return;
  }

  router.push({
    name: "report-detail",
    params: { sessionId: activeSessionId.value },
  });
};

const closeModal = () => {
  isModalOpen.value = false;
};

const continueWithoutCamera = () => {
  isCameraPermissionModalOpen.value = false;
  isCameraReady.value = false;
  currentQuestion.value = currentQuestion.value || "AI 서버로부터 면접 질문을 구성하고 있습니다...";
};

// --- 핵심 비즈니스 메서드 아키텍처 ---

const getAccessToken = () => localStorage.getItem("accessToken") || "";

const createWebSocketUrl = () => {
  const token = getAccessToken();
  const sockJsServerId = "000";
  const sockJsSessionId = `${Date.now()}${Math.random().toString(36).slice(2)}`;
  const endpointPath = USE_SOCKJS_TRANSPORT
    ? `${WS_INTERVIEW_PATH}/${sockJsServerId}/${sockJsSessionId}/websocket`
    : WS_INTERVIEW_PATH;
  const url = new URL(webSocketUrl(endpointPath));

  // 브라우저 WebSocket은 핸드셰이크에 Authorization 헤더를 직접 실을 수 없습니다.
  // 백엔드가 query token을 허용하지 않더라도 STOMP CONNECT 헤더에도 같은 토큰을 보냅니다.
  if (token) {
    url.searchParams.set("access_token", token);
  }

  return url.toString();
};

const sendStompFrame = (command, headers = {}, body = "") => {
  if (!socket || socket.readyState !== WebSocket.OPEN) return false;

  const headerLines = Object.entries(headers)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}:${value}`);

  const headerText = headerLines.join("\n");
  const frame = `${command}\n${headerText}\n\n${body}${STOMP_NULL}`;

  socket.send(USE_SOCKJS_TRANSPORT ? JSON.stringify([frame]) : frame);
  return true;
};

const connectStomp = () => {
  const accessToken = getAccessToken();

  sendStompFrame("CONNECT", {
    "accept-version": "1.2",
    "heart-beat": "10000,10000",
    Authorization: accessToken ? `Bearer ${accessToken}` : "",
  });
};

const sendStompJson = (destination, payload) => {
  return sendStompFrame(
    "SEND",
    {
      destination,
      "content-type": "application/json",
    },
    JSON.stringify(payload),
  );
};

const subscribeStompTopic = (destination) => {
  stompSubscriptionSeq += 1;
  sendStompFrame("SUBSCRIBE", {
    id: `sub-${stompSubscriptionSeq}`,
    destination,
  });
};

const parseStompFrame = (rawFrame) => {
  const [headerBlock, ...bodyParts] = rawFrame.split("\n\n");
  const headerLines = headerBlock.split("\n");
  const command = headerLines.shift();
  const headers = {};

  headerLines.forEach((line) => {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex <= 0) return;
    headers[line.slice(0, separatorIndex)] = line.slice(separatorIndex + 1);
  });

  return {
    command,
    headers,
    body: bodyParts.join("\n\n"),
  };
};

const parseJsonSafely = (body) => {
  try {
    return JSON.parse(body);
  } catch (error) {
    console.error("STOMP 메시지 JSON 파싱 실패:", error, body);
    return null;
  }
};

const parseSockJsMessages = (rawMessage) => {
  if (!USE_SOCKJS_TRANSPORT) return [rawMessage];
  if (rawMessage === "o") {
    sockJsOpen = true;
    connectStomp();
    return [];
  }
  if (rawMessage === "h") return [];
  if (rawMessage.startsWith("c")) {
    console.warn("SockJS 연결 종료 프레임:", rawMessage);
    return [];
  }
  if (!rawMessage.startsWith("a")) return [];

  try {
    return JSON.parse(rawMessage.slice(1));
  } catch (error) {
    console.error("SockJS 메시지 파싱 실패:", error, rawMessage);
    return [];
  }
};

const subscribeInterviewTopics = () => {
  const sessionId = activeSessionId.value;

  subscribeStompTopic(`/topic/session/${sessionId}/question`);
  subscribeStompTopic(`/topic/session/${sessionId}/error`);
  subscribeStompTopic(`/topic/realtime/${sessionId}`);
  subscribeStompTopic(`/topic/realtime/${sessionId}/errors`);
  subscribeStompTopic(`/topic/realtime/${sessionId}/completed`);
  subscribeStompTopic(`/topic/realtime/${sessionId}/audio`);
};

const normalizeEmotionLabel = (label) => {
  const normalizedLabel = String(label || "").toUpperCase();

  if (normalizedLabel === "NERVOUS_ANXIOUS") return "Nervous";
  if (normalizedLabel === "STABLE_CONFIDENT") return "Stable";
  return "Neutral";
};

const applyEmotionResult = (label, feedback = "") => {
  const emotion = normalizeEmotionLabel(label);
  currentEmotion.value = emotion;

  if (analyticsLog[emotion] !== undefined) {
    analyticsLog[emotion]++;
    analyticsLog.totalTicks++;
  }

  showWarning.value = Boolean(feedback && emotion === "Nervous");
  warningMessage.value = feedback;
};

const handleQuestionEvent = (payload) => {
  if (payload.type === "INITIAL_QUESTIONS_READY") {
    questionList.value = payload.questions || [];
    currentQuestion.value = payload.firstQuestion || questionList.value[0]?.question || "첫 질문을 불러왔습니다.";
    questionIndex.value = 1;
    totalQuestions.value = questionList.value.length || totalQuestions.value;
    isFollowUpQuestion.value = false;
    currentQuestionAnswered = false;
    isWaitingForQuestion.value = false;
    startFrameTransmission();
    startAudioTransmission();
    return;
  }

  if (payload.type === "NEXT_QUESTION") {
    if (isFinishing) return;
    // 마지막 직전 질문의 답변을 바탕으로 생성된 꼬리물기 질문 — 전체 질문 수(totalQuestions)는 그대로 유지하고
    // 이 질문이 N번째(진짜 마지막) 질문이 됨
    questionIndex.value += 1;
    isFollowUpQuestion.value = true;
    currentQuestion.value = payload.question || "다음 질문을 불러왔습니다.";
    currentQuestionAnswered = false;
    isWaitingForQuestion.value = false;
    resetAudioAccumulator();
  }
};

const handleErrorEvent = (payload) => {
  showWarning.value = true;
  warningMessage.value = payload.message || "면접 처리 중 오류가 발생했습니다.";
  isWaitingForQuestion.value = false;
};

const handleRealtimeEvent = (payload) => {
  const result = payload.data || payload;
  applyEmotionResult(result.label, result.feedback);
};

const handleAudioFeedbackEvent = (payload) => {
  const data = payload.data || payload;
  if (!data.status) return;

  if (audioFeedbackTimer) clearTimeout(audioFeedbackTimer);

  if (data.status === "OPTIMAL") {
    audioFeedbackText.value = data.message || "음성 상태가 좋습니다";
    audioFeedbackIsGood.value = true;
    showAudioFeedback.value = true;
    audioFeedbackTimer = setTimeout(() => {
      showAudioFeedback.value = false;
    }, 4000);
  } else {
    audioFeedbackText.value = data.message || "음성 품질을 확인해주세요";
    audioFeedbackIsGood.value = false;
    showAudioFeedback.value = true;
    audioFeedbackTimer = setTimeout(() => {
      showAudioFeedback.value = false;
    }, 8000);
  }
};

const handleStompFrame = (frame) => {
  if (frame.command === "CONNECTED") {
    stompConnected = true;
    console.log("STOMP 면접 채널 연결 완료");
    subscribeInterviewTopics();
    return;
  }

  if (frame.command === "ERROR") {
    console.error("STOMP 연결 오류:", frame.body);
    currentQuestion.value = "면접 서버 연결 중 오류가 발생했습니다.";
    return;
  }

  if (frame.command !== "MESSAGE") return;

  const payload = parseJsonSafely(frame.body);
  if (!payload) return;

  const destination = frame.headers.destination || "";

  if (destination.includes("/question")) {
    handleQuestionEvent(payload);
  } else if (destination.includes("/error") || destination.includes("/errors")) {
    handleErrorEvent(payload);
  } else if (destination.includes("/realtime/") && destination.includes("/audio")) {
    handleAudioFeedbackEvent(payload);
  } else if (destination.includes("/realtime/") && destination.includes("/completed")) {
    console.log("실시간 분석 종료 완료:", payload);
  } else if (destination.includes("/realtime/")) {
    handleRealtimeEvent(payload);
  }
};

const initFaceLandmarker = async () => {
  if (faceLandmarker || isFaceLandmarkerLoading) return faceLandmarker;

  isFaceLandmarkerLoading = true;

  try {
    const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);

    const landmarkerOptions = {
      baseOptions: {
        modelAssetPath: FACE_LANDMARKER_MODEL_URL,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numFaces: 1,
      outputFaceBlendshapes: true,
    };

    try {
      faceLandmarker = await FaceLandmarker.createFromOptions(vision, landmarkerOptions);
    } catch (gpuError) {
      console.warn("MediaPipe GPU 초기화 실패, CPU로 재시도합니다:", gpuError);
      faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        ...landmarkerOptions,
        baseOptions: {
          ...landmarkerOptions.baseOptions,
          delegate: "CPU",
        },
      });
    }

    return faceLandmarker;
  } catch (error) {
    console.error("MediaPipe Face Landmarker 초기화 실패:", error);
    showWarning.value = true;
    warningMessage.value = "얼굴 특징점 분석 모델을 불러오지 못했습니다. 면접은 계속 진행됩니다.";
    return null;
  } finally {
    isFaceLandmarkerLoading = false;
  }
};

let _workletFirstMessage = true;
const handleAudioWorkletMessage = ({ data: features }) => {
  if (_workletFirstMessage) {
    console.log("[MIC] AudioWorklet 첫 번째 window 수신 — 정상 동작 중", features);
    _workletFirstMessage = false;
  }
  const now = Date.now();

  if (features.isSpeaking && !audioAcc.firstSpeechMs) {
    audioAcc.firstSpeechMs = now;
  }

  // 발화↔침묵 전환 시 포즈 구간 기록
  if (audioAcc.prevIsSpeaking && !features.isSpeaking) {
    audioAcc.silenceStartMs = now;
    audioAcc.inSilence = true;
  } else if (!audioAcc.prevIsSpeaking && features.isSpeaking && audioAcc.inSilence) {
    const pauseDuration = now - audioAcc.silenceStartMs;
    if (pauseDuration >= PAUSE_MIN_MS) {
      audioAcc.pauseSegments.push({ durationMs: pauseDuration });
    }
    audioAcc.inSilence = false;
  }

  // 짧은 발화 burst → 필러음 근사 카운트
  if (features.isSpeaking && features.speechDurationMs < FILLER_BURST_MAX_MS) {
    audioAcc.shortBursts++;
  }

  audioAcc.prevIsSpeaking = features.isSpeaking;
  audioAcc.windows.push(features);
  pendingAudioWindows.push(features);
};

const initSpeechRecognition = () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    console.warn("Web Speech API 미지원 브라우저 — STT 비활성화");
    return;
  }

  if (speechRecognition) return; // 중복 초기화 방지

  speechRecognition = new SR();
  speechRecognition.lang = "ko-KR";
  speechRecognition.continuous = true;
  speechRecognition.interimResults = true;
  speechRecognition.maxAlternatives = 1;

  speechRecognition.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        const text = event.results[i][0].transcript;
        currentTranscript.value += text;
        pendingTranscript += text;
        interim = "";
        console.log(
          `[STT] final +${text.length}자: "${text}" | 누적: "${currentTranscript.value}" | pending: "${pendingTranscript}"`,
        );
      } else {
        interim += event.results[i][0].transcript;
      }
    }
    currentInterim = interim;
    if (interim) console.log(`[STT] interim: "${currentTranscript.value}${interim}"`);
    pendingTranscript = currentInterim;
  };

  speechRecognition.onend = () => {
    console.log("[STT] onend — 재시작");
    if (micIsStopped) return;
    setTimeout(() => {
      if (micIsStopped) return;
      try {
        speechRecognition.start();
      } catch {
        // 이미 실행 중이면 무시
      }
    }, 150);
  };

  speechRecognition.onerror = (event) => {
    console.warn(`[STT] error: ${event.error}`);
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      micIsStopped = true;
    }
    // no-speech / network 오류는 onend에서 재시작 처리
  };

  micIsStopped = false;
  speechRecognition.start();
  console.log("[STT] 시작");
};

const initMicStream = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    console.warn("[MIC] getUserMedia 미지원");
    return false;
  }

  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    console.log("[MIC] 마이크 스트림 획득 성공");

    audioContext = new AudioContext();
    console.log(`[MIC] AudioContext 생성 — state=${audioContext.state}, sampleRate=${audioContext.sampleRate}`);
    if (audioContext.state === "suspended") {
      await audioContext.resume();
      console.log(`[MIC] AudioContext resume 완료 — state=${audioContext.state}`);
    }

    await audioContext.audioWorklet.addModule("/worklets/audio-processor.js");
    console.log("[MIC] AudioWorklet 모듈 로드 완료");

    const source = audioContext.createMediaStreamSource(micStream);
    audioWorkletNode = new AudioWorkletNode(audioContext, "audio-feature-processor");
    audioWorkletNode.port.onmessage = handleAudioWorkletMessage;

    source.connect(audioWorkletNode);
    audioWorkletNode.connect(audioContext.destination);
    console.log("[MIC] AudioWorklet 파이프라인 연결 완료 — 1초마다 window 수신 시작");

    isMicReady.value = true;
    audioAcc.questionStartMs = Date.now();
    return true;
  } catch (err) {
    console.warn("마이크 초기화 실패 (음성 분석 비활성화):", err);
    console.error("[MIC] 초기화 실패:", err);
    isMicReady.value = false;
    return false;
  }
};

const createFaceBoundingBox = (landmarks) => {
  const xs = landmarks.map((point) => point.x);
  const ys = landmarks.map((point) => point.y);
  const videoWidth = videoRef.value?.videoWidth || 1;
  const videoHeight = videoRef.value?.videoHeight || 1;
  const rawX1 = Math.min(...xs) * videoWidth;
  const rawY1 = Math.min(...ys) * videoHeight;
  const rawX2 = Math.max(...xs) * videoWidth;
  const rawY2 = Math.max(...ys) * videoHeight;
  const width = rawX2 - rawX1;
  const height = rawY2 - rawY1;
  const marginX = width * FACE_BBOX_MARGIN;
  const marginY = height * FACE_BBOX_MARGIN;

  return {
    x1: Math.max(0, Math.round(rawX1 - marginX)),
    y1: Math.max(0, Math.round(rawY1 - marginY)),
    x2: Math.min(videoWidth, Math.round(rawX2 + marginX)),
    y2: Math.min(videoHeight, Math.round(rawY2 + marginY)),
  };
};

const createEmptyFacePayload = () => ({
  tensorShape: [...FACE_INPUT_SHAPE],
  features: [],
  faceDetected: false,
  bbox: { x1: 0, y1: 0, x2: 0, y2: 0 },
});

const preprocessFaceCrop = (bbox) => {
  const video = videoRef.value;
  if (!video || bbox.x2 <= bbox.x1 || bbox.y2 <= bbox.y1) return null;

  if (!facePreprocessCanvas) {
    facePreprocessCanvas = document.createElement("canvas");
    facePreprocessCanvas.width = FACE_INPUT_SIZE;
    facePreprocessCanvas.height = FACE_INPUT_SIZE;
  }

  const context = facePreprocessCanvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  context.drawImage(
    video,
    bbox.x1,
    bbox.y1,
    bbox.x2 - bbox.x1,
    bbox.y2 - bbox.y1,
    0,
    0,
    FACE_INPUT_SIZE,
    FACE_INPUT_SIZE,
  );

  const { data } = context.getImageData(0, 0, FACE_INPUT_SIZE, FACE_INPUT_SIZE);
  const pixelCount = FACE_INPUT_SIZE * FACE_INPUT_SIZE;
  const features = new Array(3 * pixelCount);

  for (let i = 0; i < pixelCount; i++) {
    const sourceIndex = i * 4;
    features[i] = Number(((data[sourceIndex] / 255 - FACE_MEAN[0]) / FACE_STD[0]).toFixed(6));
    features[pixelCount + i] = Number(((data[sourceIndex + 1] / 255 - FACE_MEAN[1]) / FACE_STD[1]).toFixed(6));
    features[pixelCount * 2 + i] = Number(((data[sourceIndex + 2] / 255 - FACE_MEAN[2]) / FACE_STD[2]).toFixed(6));
  }

  return features;
};

const createFaceFeaturePayload = () => {
  if (!faceLandmarker || !videoRef.value || !videoRef.value.videoWidth || !videoRef.value.videoHeight) {
    return null;
  }

  const result = faceLandmarker.detectForVideo(videoRef.value, performance.now());
  const landmarks = result.faceLandmarks?.[0];

  if (!landmarks?.length) {
    return createEmptyFacePayload();
  }

  const bbox = createFaceBoundingBox(landmarks);
  const features = preprocessFaceCrop(bbox);

  if (!features) {
    return createEmptyFacePayload();
  }

  return {
    tensorShape: [...FACE_INPUT_SHAPE],
    features,
    faceDetected: true,
    bbox,
  };
};

// 1. 하드웨어 카메라 스트림 활성화 연동
const initCameraStream = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    cameraPermissionTitle.value = "카메라를 사용할 수 없습니다";
    cameraPermissionMessage.value =
      "현재 브라우저 또는 접속 환경에서 카메라 권한 요청을 지원하지 않습니다. 실시간 표정 분석만 제외하고 면접은 계속 진행할 수 있습니다.";
    isCameraPermissionModalOpen.value = true;
    return false;
  }

  isCameraRequesting.value = true;

  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720, frameRate: { ideal: 30 } },
    });
    if (videoRef.value) {
      videoRef.value.srcObject = localStream;
    }
    isCameraReady.value = true;
    isCameraPermissionModalOpen.value = false;
    await initFaceLandmarker();
    return true;
  } catch (err) {
    console.error("웹캠 엑세스 거부 또는 장치 에러:", err);
    isCameraReady.value = false;
    isCameraPermissionModalOpen.value = true;
    cameraPermissionTitle.value =
      err.name === "NotAllowedError" ? "카메라 권한이 차단되었습니다" : "카메라 연결을 확인해주세요";
    cameraPermissionMessage.value =
      err.name === "NotAllowedError"
        ? "브라우저에서 카메라 접근이 거부되었습니다. 카메라 없이 진행하거나, 사이트 설정에서 카메라 권한을 허용한 뒤 다시 시도해주세요."
        : "카메라 장치를 찾을 수 없거나 다른 앱에서 사용 중입니다. 카메라 없이 진행해도 질문 답변은 계속 사용할 수 있습니다.";
    return false;
  } finally {
    isCameraRequesting.value = false;
  }
};

const requestCameraPermission = async () => {
  await initCameraStream();
};

// 2. 백엔드 Spring Boot 웹소켓 및 데이터 파이프라인 연동
const initWebSocketPipeline = () => {
  socket = new WebSocket(createWebSocketUrl());

  socket.onopen = () => {
    if (!USE_SOCKJS_TRANSPORT) {
      connectStomp();
    }
  };

  socket.onmessage = (messageEvent) => {
    if (messageEvent.data === "\n") return;

    parseSockJsMessages(String(messageEvent.data)).forEach((message) => {
      String(message)
        .split(STOMP_NULL)
        .filter((rawFrame) => rawFrame.trim())
        .map(parseStompFrame)
        .forEach(handleStompFrame);
    });
  };

  socket.onerror = (error) => console.error("소켓 파이프라인 오류:", error);
  socket.onclose = (event) => {
    const hadSockJsOpenFrame = sockJsOpen;
    stompConnected = false;
    sockJsOpen = false;
    console.log("면접 WebSocket 연결 종료:", {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
      hadSockJsOpenFrame,
    });
  };
};

// 3. 논문 스펙에 명시된 6 FPS 주기 백엔드 이미지 전송 파이프라인
const startFrameTransmission = () => {
  if (imageStreamingInterval) clearInterval(imageStreamingInterval);

  imageStreamingInterval = setInterval(async () => {
    if (!videoRef.value || !stompConnected) return;
    if (!isCameraReady.value || !videoRef.value.videoWidth || !videoRef.value.videoHeight) return;
    if (isFrameProcessing) return;

    isFrameProcessing = true;

    try {
      if (!faceLandmarker) {
        await initFaceLandmarker();
      }

      const facePayload = createFaceFeaturePayload();
      if (!facePayload) return;

      sendStompJson("/app/realtime.frames", {
        sessionId: activeSessionId.value,
        userId: activeUserId.value,
        tensorShape: facePayload.tensorShape,
        features: facePayload.features,
        timestamp: Date.now(),
        faceDetected: facePayload.faceDetected,
        bbox: facePayload.bbox,
      });
    } finally {
      isFrameProcessing = false;
    }
  }, REALTIME_FRAME_INTERVAL_MS);
};

const startAudioTransmission = () => {
  if (audioRealtimeInterval) clearInterval(audioRealtimeInterval);

  audioRealtimeInterval = setInterval(() => {
    if (!stompConnected || !isMicReady.value) return;
    if (pendingAudioWindows.length === 0 && !pendingTranscript) return;

    const windows = pendingAudioWindows.splice(0);
    const transcript = (pendingTranscript + currentInterim).trim();
    const sent = sendStompJson("/app/realtime.audio", {
      sessionId: activeSessionId.value,
      userId: activeUserId.value,
      timestamp: Date.now(),
      questionIndex: questionIndex.value,
      windowMs: AUDIO_REALTIME_INTERVAL_MS,
      windows,
      transcript,
    });
    if (sent) pendingTranscript = "";
    console.log(
      `[AUDIO] 전송 ${sent ? "성공" : "실패(소켓 미연결)"} | windows=${windows.length} | transcript="${transcript}"`,
    );
  }, AUDIO_REALTIME_INTERVAL_MS);
};

const calculateAudioSummary = () => {
  const windows = audioAcc.windows;
  if (!windows.length) return null;

  const totalSpeechMs = windows.reduce((s, w) => s + w.speechDurationMs, 0);
  const totalWindowMs = windows.length * AUDIO_REALTIME_INTERVAL_MS;
  const speechRatio = totalWindowMs > 0 ? parseFloat((totalSpeechMs / totalWindowMs).toFixed(2)) : 0;

  const speechWindows = windows.filter((w) => w.isSpeaking);
  const rmsValues = speechWindows.map((w) => w.rms);
  const avgRms =
    rmsValues.length > 0 ? parseFloat((rmsValues.reduce((s, v) => s + v, 0) / rmsValues.length).toFixed(4)) : 0;
  const rmsCoV =
    rmsValues.length > 1 && avgRms > 0
      ? parseFloat(
          (Math.sqrt(rmsValues.reduce((s, v) => s + (v - avgRms) ** 2, 0) / rmsValues.length) / avgRms).toFixed(3),
        )
      : 0;

  const pauseCount = audioAcc.pauseSegments.length;
  const avgPauseDurationMs =
    pauseCount > 0 ? Math.round(audioAcc.pauseSegments.reduce((s, p) => s + p.durationMs, 0) / pauseCount) : 0;
  const maxPauseDurationMs = pauseCount > 0 ? Math.max(...audioAcc.pauseSegments.map((p) => p.durationMs)) : 0;

  const responseLatencyMs = audioAcc.firstSpeechMs ? audioAcc.firstSpeechMs - audioAcc.questionStartMs : 0;

  const lastTwo = windows.slice(-2);
  const lastAvgRms = lastTwo.length > 0 ? lastTwo.reduce((s, w) => s + w.rms, 0) / lastTwo.length : 0;
  const endFadeOut = avgRms > 0 && lastAvgRms < avgRms * 0.4;

  const transcript = currentTranscript.value.trim();
  const words = transcript ? transcript.split(/\s+/) : [];
  const wordCount = words.length;
  const uniqueWords = new Set(words).size;
  const ttr = wordCount > 0 ? parseFloat((uniqueWords / wordCount).toFixed(2)) : 0;
  const fillerWordCount = words.filter((w) => KOREAN_FILLERS.includes(w)).length;
  const wpm = totalSpeechMs > 0 ? Math.round(wordCount / (totalSpeechMs / 60000)) : 0;

  return {
    speechRatio,
    avgRms,
    rmsCoV,
    wpm,
    pauseCount,
    avgPauseDurationMs,
    maxPauseDurationMs,
    responseLatencyMs,
    endFadeOut,
    estimatedFillerCount: audioAcc.shortBursts,
    fillerWordCount,
    wordCount,
    ttr,
  };
};

const resetAudioAccumulator = () => {
  audioAcc.windows = [];
  audioAcc.pauseSegments = [];
  audioAcc.questionStartMs = Date.now();
  audioAcc.firstSpeechMs = null;
  audioAcc.inSilence = false;
  audioAcc.silenceStartMs = null;
  audioAcc.shortBursts = 0;
  audioAcc.prevIsSpeaking = false;
  currentTranscript.value = "";
  pendingAudioWindows = [];
  pendingTranscript = "";
  currentInterim = "";
};

const submitCurrentAnswer = ({ requestNextQuestion: shouldRequestNext = false } = {}) => {
  if (currentQuestionAnswered) {
    console.warn("[ANSWER] 이미 제출된 질문 — 중복 전송 차단");
    return false;
  }
  if (stompConnected) {
    currentQuestionAnswered = true;
    isWaitingForQuestion.value = shouldRequestNext;
    const audioSummary = isMicReady.value ? calculateAudioSummary() : null;
    const answer = currentTranscript.value.trim();
    return sendStompJson("/app/session.answer", {
      sessionId: Number(activeSessionId.value),
      question: currentQuestion.value,
      answer,
      emotionResult: String(currentEmotion.value).toUpperCase(),
      responseTimeSeconds: timerSeconds.value,
      requestNextQuestion: shouldRequestNext,
      ...(audioSummary && { audioSummary }),
    });
  }

  return false;
};

// 4. 다음 질문 넘어가기 컨트롤 인터랙션
// 4-1. 사전에 생성된 초기 질문 목록에서 다음 질문으로 즉시 이동 (AI 호출 없이 진행)
const advanceToNextQuestion = () => {
  submitCurrentAnswer();

  questionIndex.value += 1;
  const nextQuestion = questionList.value[questionIndex.value - 1];
  currentQuestion.value = nextQuestion?.question || "다음 질문을 불러왔습니다.";
  currentQuestionAnswered = false;
  isWaitingForQuestion.value = false;
  resetAudioAccumulator();
};

// 4-2. 초기 질문 목록의 마지막 직전(N-1번째) 질문 답변 시 AI에게 꼬리물기 질문(N번째) 생성을 요청
const requestNextQuestion = () => {
  if (stompConnected) {
    submitCurrentAnswer({ requestNextQuestion: true });
    return;
  }

  showWarning.value = true;
  warningMessage.value = "면접 서버와 연결된 뒤 답변을 제출할 수 있습니다.";
};

const completeInterview = () => {
  isFinishing = true;
  submitCurrentAnswer();
  finishInterview({ redirectToReport: true });
};

const handleAnswerButtonClick = () => {
  if (isLastQuestion.value) {
    completeInterview();
    return;
  }

  // N-1번째 질문까지는 사전 생성된 목록을 그대로 사용하고,
  // N-1번째 질문의 답변 시점에만 꼬리물기 질문(N번째)을 요청한다.
  if (questionIndex.value < totalQuestions.value - 1) {
    advanceToNextQuestion();
  } else {
    requestNextQuestion();
  }
};

const stopCamera = () => {
  if (imageStreamingInterval) {
    clearInterval(imageStreamingInterval);
    imageStreamingInterval = null;
  }
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }
  if (videoRef.value) videoRef.value.srcObject = null;
  isCameraReady.value = false;
};

// 5. 모의 면접 세션 종료 처리 및 통계 가공 알고리즘 (안전 보정 추가)
const finishInterview = ({ redirectToReport = false } = {}) => {
  stopCamera();

  if (!redirectToReport) {
    isModalOpen.value = true; // 강제로 무조건 팝업 오픈
  }

  try {
    if (stompConnected) {
      sendStompJson("/app/realtime.end", {
        sessionId: activeSessionId.value,
        includesAudio: isMicReady.value,
      });
    }

    if (activeSessionId.value) {
      updateInterviewSessionStatus(activeSessionId.value, "ENDED").catch((error) => {
        console.error("면접 종료 상태 변경 실패:", error);
      });
    }

    if (analyticsLog.totalTicks > 0) {
      finalScores.value.stable = Math.round((analyticsLog.Stable / analyticsLog.totalTicks) * 100);
      finalScores.value.nervous = Math.round((analyticsLog.Nervous / analyticsLog.totalTicks) * 100);
      finalScores.value.neutral = Math.round((analyticsLog.Neutral / analyticsLog.totalTicks) * 100);
    } else {
      finalScores.value = { stable: 0, nervous: 0, neutral: 0 };
    }

    if (analyticsLog.totalTicks === 0) {
      aiFeedbackComment.value =
        "실시간 표정 분석 데이터가 아직 충분하지 않습니다. 상세 리포트가 준비되면 서버 분석 결과를 확인해주세요.";
    } else if (finalScores.value.stable >= 70) {
      aiFeedbackComment.value =
        "전반적으로 시선 고정이 매우 안정적(Stable)이고 감정 변동 폭이 낮아 면접관에게 신뢰감을 주는 모범적인 태도를 보여주었습니다. 실전에서도 이 페이스를 유지하세요!";
    } else if (finalScores.value.nervous >= finalScores.value.stable) {
      aiFeedbackComment.value =
        "질문 답변 구간별 긴장(Nervous) 감지 패턴이 지배적입니다. 모니터 시선 이탈률이 다소 빈번하니, 답변 중 어깨의 긴장도를 낮추고 카메라 정면 응시율을 높이는 보완 연습을 추천합니다.";
    } else {
      aiFeedbackComment.value =
        "안정적인 밸런스를 유지했으나 표정에 감정 변화가 거의 없는 무표정(Neutral) 빈도가 높습니다. 첫인상 브리핑과 마지막 발언 시에는 엷은 미소를 곁들이면 훨씬 더 긍정적인 인상을 심어줄 수 있습니다.";
    }
  } catch (error) {
    console.error("통계 연산 중 오류 발생:", error);
    finalScores.value = { stable: 82, nervous: 12, neutral: 6 };
    aiFeedbackComment.value = "데이터 처리 중 오류가 발생하여 기본 리포트를 출력합니다.";
  }

  if (redirectToReport) {
    goToReport();
  }
};

const hydrateInterviewSetting = async () => {
  if (!activeSessionId.value) return;

  try {
    const setting = await getInterviewSetting(activeSessionId.value);
    if (setting?.questionCount) {
      totalQuestions.value = setting.questionCount;
    }
  } catch (error) {
    console.warn("면접 설정 조회 실패:", error);
  }
};

// --- 라이프사이클 훅 리소스 제어 처리 ---
onMounted(async () => {
  if (!activeSessionId.value) {
    currentQuestion.value = "면접 세션 정보가 없습니다. 설정 화면에서 다시 시작해주세요.";
    isWaitingForQuestion.value = true;
    return;
  }

  await hydrateInterviewSetting();
  timerInterval = setInterval(() => timerSeconds.value++, 1000);
  isCameraPermissionModalOpen.value = true;
  initWebSocketPipeline();

  // STT는 AudioWorklet과 독립적으로 시작 (SpeechRecognition은 자체 마이크 관리)
  initSpeechRecognition();
  sttStatusInterval = setInterval(() => {
    const state = speechRecognition ? (micIsStopped ? "stopped" : "running") : "not-initialized";
    console.log(`[STT] 상태=${state} | 누적="${currentTranscript.value}" | Q${questionIndex.value}`);
  }, 10000);

  // AudioWorklet 기반 음성 특징 분석 (실패해도 STT/면접 진행에 영향 없음)
  initMicStream();
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
  if (sttStatusInterval) clearInterval(sttStatusInterval);
  if (imageStreamingInterval) clearInterval(imageStreamingInterval);
  if (audioRealtimeInterval) clearInterval(audioRealtimeInterval);
  if (audioFeedbackTimer) clearTimeout(audioFeedbackTimer);
  if (localStream) localStream.getTracks().forEach((track) => track.stop());
  if (micStream) micStream.getTracks().forEach((track) => track.stop());
  if (audioWorkletNode) audioWorkletNode.disconnect();
  if (audioContext) audioContext.close();
  if (speechRecognition) {
    micIsStopped = true;
    speechRecognition.stop();
  }
  if (faceLandmarker) faceLandmarker.close();
  if (socket) socket.close();
});
</script>
