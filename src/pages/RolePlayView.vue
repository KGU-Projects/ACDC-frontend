<template>
  <div class="bg-slate-50 min-h-screen p-3 sm:p-4">
    <div v-if="loadError" class="max-w-xl mx-auto mt-20 text-center">
      <p class="text-rose-500 font-bold mb-4">{{ loadError }}</p>
      <button @click="router.push('/home')" class="text-sm font-bold text-brand">홈으로</button>
    </div>

    <div v-else-if="session" class="max-w-7xl mx-auto flex flex-col h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-2rem)]">
      <header class="px-5 py-3 flex items-center justify-between" :class="phase === 'call' ? 'fixed top-0 inset-x-0 z-50 bg-slate-900/60 backdrop-blur-sm text-white' : 'bg-white rounded-2xl shadow mb-3'">
        <div>
          <h1 class="text-base font-extrabold" :class="phase === 'call' ? 'text-white' : 'text-slate-800'">{{ session.scenarioTitle }}</h1>
          <p class="text-[11px]" :class="phase === 'call' ? 'text-white/70' : 'text-slate-400'">역할수행 · 상대역 {{ counterpart.name }} {{ counterpart.position }}</p>
        </div>
        <div class="flex items-center gap-3">
          <span v-if="phase === 'call'" class="font-mono text-lg font-bold" :class="remaining <= 120 ? 'text-rose-400' : phase === 'call' ? 'text-white' : 'text-slate-700'">{{ label }}</span>
          <button @click="submit" :disabled="phase !== 'call' || submitting || sending" class="bg-brand hover:bg-brandHover disabled:bg-slate-300 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">
            {{ submitting ? '채점 중...' : '면담 종료·제출' }}
          </button>
        </div>
      </header>

      <p v-if="errorMessage" class="text-xs font-bold" :class="phase === 'call' ? 'fixed top-16 inset-x-0 z-50 mx-auto w-fit max-w-[90%] rounded-full bg-rose-500/90 text-white px-4 py-1.5' : 'mb-2 text-rose-500'">{{ errorMessage }}</p>

      <!-- 과제 숙지 -->
      <PrepPanel
        v-if="phase === 'prep'"
        :session-id="sessionId"
        :scenario="scenario"
        :remaining-label="label"
        :can-start="!starting && !requesting"
        :media-error="mediaError"
        :requesting="requesting"
        :show-skip="demoSkip"
        @start="startFromPrep"
        @skip="startFromPrep"
        @retry-media="checkDevices"
      />

      <p v-else-if="phase === 'loading'" class="text-center text-slate-400 text-sm mt-20">불러오는 중...</p>

      <!-- 권한 요청: 카메라·마이크 스트림이 있어야 면담에 들어간다 -->
      <div v-else-if="phase === 'permission'" class="flex-grow flex items-center justify-center min-h-0">
        <div class="bg-white rounded-2xl shadow p-6 w-full max-w-lg text-center">
          <h2 class="text-lg font-extrabold text-slate-800 mb-1">카메라·마이크 확인</h2>
          <p v-if="permissionWarning" class="text-sm font-bold text-rose-500 mb-2">{{ permissionWarning }}</p>
          <p class="text-xs text-slate-500 mb-4 leading-relaxed">
            역할수행은 영상통화 형식으로 진행되며, 평가를 위해 표정과 음성 특징을 분석합니다.<br />
            영상 자체는 저장·전송하지 않고, 얼굴 이미지 정보와 음량·발화 시간 같은 수치만 서버로 보냅니다.
          </p>
          <div class="relative aspect-video bg-slate-900 rounded-xl overflow-hidden mb-4">
            <video ref="gateVideoRef" autoplay muted playsinline class="w-full h-full object-cover -scale-x-100"></video>
            <p v-if="requesting" class="absolute inset-0 flex items-center justify-center text-sm text-white/80">카메라와 마이크를 확인하는 중...</p>
            <p v-else-if="!mediaStream" class="absolute inset-0 flex items-center justify-center text-sm text-white/60 px-6">미리보기를 불러오지 못했습니다</p>
          </div>
          <p v-if="mediaError" class="text-sm font-bold text-rose-500 mb-4 leading-relaxed">{{ mediaError }}</p>
          <div class="flex gap-2 justify-center">
            <button @click="retryFromPermission" :disabled="requesting" class="bg-brand hover:bg-brandHover disabled:bg-slate-300 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">다시 요청</button>
            <button @click="leave" class="bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">홈으로</button>
          </div>
        </div>
      </div>

      <!-- 면담: 영상통화가 뷰포트 전체를 채우고, 헤더와 왼쪽 채팅이 그 위에 겹친다 -->
      <div v-else-if="phase === 'call'" class="fixed inset-0 z-40 bg-slate-900 overflow-hidden" data-testid="call-stage">
        <CounterpartAvatar :name="counterpart.name" :position="counterpart.position" :speaking="aiSpeaking" :thinking="sending" />

        <!-- 채팅 오버레이: 헤더 아래부터 끝까지, 왼쪽 35%(좁은 화면은 넓게, 접기 가능) -->
        <div :class="chatOpen ? '' : 'max-lg:hidden'" class="absolute left-0 top-[3.75rem] bottom-0 z-20 w-[85%] sm:w-[50%] lg:w-[35%]">
          <CallChatOverlay
            v-model:draft="draft"
            :messages="messages"
            :sending="sending"
            :listening="listening"
            :speech-supported="speechSupported"
            :submitting="submitting"
            :counterpart-name="counterpart.name"
            @send="send"
            @toggle-listening="toggleListening"
          />
        </div>
        <button @click="chatOpen = !chatOpen" class="lg:hidden absolute left-3 bottom-3 z-30 rounded-full bg-slate-900/70 text-white text-xs font-bold px-3 py-2 shadow" :class="chatOpen ? 'hidden' : ''">채팅 열기</button>
        <button v-if="chatOpen" @click="chatOpen = false" class="lg:hidden absolute left-[calc(85%-2.25rem)] sm:left-[calc(50%-2.25rem)] top-[4.25rem] z-30 w-7 h-7 rounded-full bg-slate-900/70 text-white text-sm font-bold" title="채팅 접기">×</button>

        <div class="absolute right-3 bottom-3 z-30 w-32 sm:w-52 aspect-video rounded-xl overflow-hidden border-2 border-white/70 shadow-lg bg-slate-800 transition-opacity" :class="chatOpen ? 'max-sm:opacity-0 max-sm:pointer-events-none' : ''" data-testid="self-view">
          <video ref="selfVideoRef" autoplay muted playsinline class="w-full h-full object-cover -scale-x-100"></video>
          <span class="absolute left-1.5 top-1.5 text-[10px] font-bold text-white bg-black/45 rounded px-1.5 py-0.5">나</span>
          <div class="absolute left-1.5 right-1.5 bottom-1.5 h-1 rounded-full bg-black/40 overflow-hidden" title="마이크 레벨">
            <div class="h-full bg-emerald-400 transition-all duration-150" :style="{ width: `${Math.round(audio.level.value * 100)}%` }"></div>
          </div>
        </div>

        <div class="absolute right-3 top-[4.5rem] z-30 flex flex-col items-end gap-1 text-[10px] font-bold pointer-events-none">
          <span class="rounded-full px-2 py-0.5 bg-black/45 text-white">● 카메라·마이크 켜짐</span>
          <span v-if="face.unavailable.value" class="rounded-full px-2 py-0.5 bg-amber-500/85 text-white">표정 분석 사용 불가</span>
          <span v-else-if="face.loading.value" class="rounded-full px-2 py-0.5 bg-black/45 text-white">표정 분석 준비 중...</span>
          <span v-else-if="face.label.value" class="rounded-full px-2 py-0.5 bg-black/45 text-white">표정: {{ emotionName(face.label.value) }}</span>
          <span v-if="audio.unavailable.value" class="rounded-full px-2 py-0.5 bg-amber-500/85 text-white">음성 분석 사용 불가</span>
        </div>
      </div>
    </div>

    <p v-else class="text-center text-slate-400 text-sm mt-20">불러오는 중...</p>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import CallChatOverlay from '../components/CallChatOverlay.vue';
import CounterpartAvatar from '../components/CounterpartAvatar.vue';
import PrepPanel from '../components/PrepPanel.vue';
import { EMOTION_LABELS, useFaceEmotion } from '../composables/useFaceEmotion';
import { useAudioFeatures } from '../composables/useAudioFeatures';
import { useMediaCapture } from '../composables/useMediaCapture';
import { useRoute, useRouter } from 'vue-router';
import { getSession, sendTurn, startCall as startCallApi, startPrep, submitSession } from '../api/acdc';
import { useCountdown } from '../composables/useCountdown';

const route = useRoute();
const router = useRouter();
const sessionId = route.params.id;

const session = ref(null);
const messages = ref([]);
const draft = ref('');
const loadError = ref('');
const errorMessage = ref('');
const sending = ref(false);
const submitting = ref(false);
const listening = ref(false);
const chatOpen = ref(true); // 좁은 화면에서 채팅을 접고 펼친다(넓은 화면은 항상 표시)
const { remaining, label, start: startCountdown, stop: stopCountdown } = useCountdown();

// prep(과제 숙지) → call(면담). permission은 면담 차례인데 카메라·마이크 스트림이 없을 때 머무는 상태.
// call로 가는 길은 enterCall 하나뿐이고, enterCall이 스트림을 확인한다.
const phase = ref('loading'); // 최초 로드가 끝나기 전에는 loading
const starting = ref(false);
const permissionWarning = ref('');
const demoSkip = import.meta.env.VITE_DEMO_SKIP === 'true';
const PERMISSION_WARNING = '카메라와 마이크 사용을 허용해야 면담을 시작할 수 있습니다.';
const gateVideoRef = ref(null);
const selfVideoRef = ref(null);
const aiSpeaking = ref(false);
const { stream: mediaStream, error: mediaError, requesting, start: startMedia, stop: stopMedia } = useMediaCapture();
const face = useFaceEmotion(sessionId);
const audio = useAudioFeatures(sessionId);
let speakingTimer = null;

const emotionName = (value) => EMOTION_LABELS[value] || value;

const bindStream = async (videoRef) => {
  await nextTick();
  if (videoRef.value && mediaStream.value) {
    videoRef.value.srcObject = mediaStream.value;
    videoRef.value.play?.().catch(() => {});
  }
};

const checkDevices = async () => {
  await startMedia();
  await bindStream(gateVideoRef);
};

// AI 응답이 표시되는 동안(글자 수에 비례) 아바타 입을 움직인다.
const speakFor = (text) => {
  clearTimeout(speakingTimer);
  aiSpeaking.value = true;
  speakingTimer = setTimeout(() => {
    aiSpeaking.value = false;
  }, Math.max(1200, (text || '').length * 60));
};

// 면담 진입의 유일한 경로. 스트림이 없으면 전환하지 않고 권한 요청 상태로 보낸다.
const hasLiveStream = () => {
  const tracks = mediaStream.value?.getTracks() || [];
  return tracks.length > 0 && tracks.every((t) => t.readyState === 'live');
};

const enterCall = async (callSeconds) => {
  if (!hasLiveStream()) {
    stopCountdown();
    permissionWarning.value = PERMISSION_WARNING;
    phase.value = 'permission';
    await bindStream(gateVideoRef);
    return false;
  }
  permissionWarning.value = '';
  phase.value = 'call';
  await bindStream(selfVideoRef);
  if (phase.value !== 'call' || !hasLiveStream()) return false;
  startCountdown(callSeconds, submit);
  audio.start(mediaStream.value);
  const video = selfVideoRef.value;
  if (video && video.readyState < 2) {
    await new Promise((resolve) => video.addEventListener('loadeddata', resolve, { once: true }));
  }
  face.start(selfVideoRef.value);
  const last = messages.value[messages.value.length - 1];
  if (last?.speaker === 'AI') speakFor(last.text);
  return true;
};

// 서버에 면담 시작을 알리고(멱등) 면담 남은 시간을 받아 진입한다.
const beginCall = async () => {
  const res = await startCallApi(sessionId);
  stopCountdown(); // 응답을 받은 뒤에만 숙지 시계를 멈춘다(실패하면 계속 돌아 만료 시 재시도된다)
  return enterCall(res.remainingSeconds);
};

// "역할 수행 시작"과 건너뛰기가 함께 쓴다. 스트림이 없으면 경고하고 권한을 다시 요청한다.
const startFromPrep = async () => {
  if (starting.value || phase.value !== 'prep') return;
  starting.value = true;
  errorMessage.value = '';
  try {
    if (!hasLiveStream()) {
      errorMessage.value = PERMISSION_WARNING;
      await checkDevices();
      // 권한 대기 중에 숙지 시간이 끝났다면 만료 처리(startCall 후 permission)를 이어서 한다.
      if (!hasLiveStream() && remaining.value > 0) return;
      errorMessage.value = '';
    }
    if (phase.value !== 'prep') return;
    await beginCall();
  } catch (error) {
    errorMessage.value = error.message || '면담을 시작하지 못했습니다.';
    if (remaining.value <= 0) scheduleExpiryRetry();
  } finally {
    starting.value = false;
  }
};

// 숙지 시간 만료: 서버상 면담은 시작된 것으로 계산된다. 스트림이 없으면 permission으로 간다.
let expiryRetryTimer = null;
const scheduleExpiryRetry = () => {
  clearTimeout(expiryRetryTimer);
  expiryRetryTimer = setTimeout(onPrepExpired, 3000);
};

const onPrepExpired = async () => {
  if (starting.value || phase.value !== 'prep') return;
  starting.value = true;
  try {
    await beginCall();
  } catch (error) {
    errorMessage.value = error.message || '면담을 시작하지 못했습니다.';
    scheduleExpiryRetry();
  } finally {
    starting.value = false;
  }
};

// permission 상태에서 스트림을 확보하면 서버의 최신 면담 남은 시간으로 바로 진입한다.
const retryFromPermission = async () => {
  if (starting.value) return;
  starting.value = true;
  errorMessage.value = '';
  try {
    await checkDevices();
    if (!mediaStream.value) {
      permissionWarning.value = PERMISSION_WARNING;
      return;
    }
    const data = await getSession(sessionId);
    if (data.stage !== 'IN_PROGRESS') {
      router.replace('/home');
      return;
    }
    await enterCall(data.remainingSeconds);
  } catch (error) {
    errorMessage.value = error.message || '면담을 시작하지 못했습니다.';
  } finally {
    starting.value = false;
  }
};

const stopCapture = () => {
  face.dispose();
  audio.stop();
  stopMedia();
};

const leave = () => {
  stopCapture();
  router.push('/home');
};

const scenario = computed(() => session.value?.scenario || {});
const counterpart = computed(() => scenario.value.counterpart || {});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const speechSupported = Boolean(SpeechRecognition);
let recognition = null;
let baseDraft = '';

const toggleListening = () => {
  if (listening.value) {
    recognition?.stop();
    return;
  }
  recognition = new SpeechRecognition();
  recognition.lang = 'ko-KR';
  recognition.continuous = true;
  recognition.interimResults = true;
  baseDraft = draft.value ? `${draft.value.trim()} ` : '';

  recognition.onresult = (event) => {
    let text = '';
    for (let i = 0; i < event.results.length; i += 1) text += event.results[i][0].transcript;
    draft.value = baseDraft + text.trim();
  };
  recognition.onerror = (event) => {
    if (event.error !== 'no-speech' && event.error !== 'aborted') {
      errorMessage.value = `음성 인식 오류: ${event.error}`;
    }
  };
  recognition.onend = () => {
    listening.value = false;
  };
  try {
    recognition.start();
    listening.value = true;
  } catch (error) {
    errorMessage.value = '음성 인식을 시작하지 못했습니다.';
  }
};

const send = async () => {
  const text = draft.value.trim();
  if (!text || sending.value || submitting.value) return;
  recognition?.stop();
  sending.value = true;
  errorMessage.value = '';
  try {
    const res = await sendTurn(sessionId, text);
    messages.value.push({ speaker: 'USER', text: res.userTurn.text }, { speaker: 'AI', text: res.aiTurn.text });
    speakFor(res.aiTurn.text);
    draft.value = '';
  } catch (error) {
    errorMessage.value = error.message || '발화를 전송하지 못했습니다.';
  } finally {
    sending.value = false;
  }
};

const submit = async () => {
  if (submitting.value) return;
  if (!messages.value.some((m) => m.speaker === 'USER')) {
    errorMessage.value = '대화를 한 번 이상 나눈 뒤 제출해주세요.';
    return;
  }
  submitting.value = true;
  errorMessage.value = '';
  stopCountdown();
  recognition?.stop();
  try {
    face.stop();
    await audio.flush();
    await submitSession(sessionId);
    stopCapture();
    router.replace('/submitted');
  } catch (error) {
    errorMessage.value = error.message || '제출에 실패했습니다.';
    submitting.value = false;
  }
};

onMounted(async () => {
  try {
    const data = await getSession(sessionId);
    if (data.stage !== 'IN_PROGRESS') {
      router.replace('/home');
      return;
    }
    session.value = data;
    messages.value = (data.turns || []).map((t) => ({ speaker: t.speaker, text: t.text }));
    if (!messages.value.length && data.scenario?.openingLine) {
      // 첫 대사는 화면에만 보여 준다(서버 대화 기록에는 사용자 발화부터 쌓인다).
      messages.value.push({ speaker: 'AI', text: data.scenario.openingLine });
    }
    if (data.phase === 'PREP') {
      // 서버가 시계를 소유한다. 새로고침해도 서버가 멱등이라 남은 시간이 늘지 않는다.
      const prep = await startPrep(sessionId);
      if (prep.phase === 'PREP') {
        phase.value = 'prep';
        startCountdown(prep.prepRemainingSeconds, onPrepExpired);
        await checkDevices();
        // 숙지가 이미 끝나(만료 처리로) permission이 된 경우, 스트림을 얻었으면 바로 면담으로 간다.
        if (phase.value === 'permission' && hasLiveStream() && !starting.value) await retryFromPermission();
        return;
      }
    }
    // 이미 면담 중이거나(CALL) 숙지가 없는 세션(null): 스트림을 확보하는 즉시 면담에 들어간다.
    phase.value = 'permission';
    await retryFromPermission();
  } catch (error) {
    loadError.value = error.message || '세션을 불러오지 못했습니다.';
  }
});

onBeforeUnmount(() => {
  recognition?.abort();
  clearTimeout(speakingTimer);
  clearTimeout(expiryRetryTimer);
  stopCapture();
});
</script>
