<template>
  <div class="flex min-h-screen flex-col bg-ground" :class="phase === 'prep' ? 'lg:h-screen' : ''">
    <div v-if="loadError" class="mx-auto mt-24 max-w-xl px-4 text-center">
      <p class="mb-4 text-[14px] text-negative" role="alert">{{ loadError }}</p>
      <button @click="router.push('/home')" class="h-11 rounded-control btn-2 px-4 text-[14px] font-medium text-ink md:h-10">홈으로</button>
    </div>

    <div v-else-if="session" class="flex flex-1 flex-col lg:min-h-0">
      <header class="flex h-12 items-center justify-between gap-3 px-4" :class="phase === 'call' ? 'fixed inset-x-0 top-0 z-50 bg-stage/80 text-white' : 'sticky top-0 z-30 border-b border-line bg-surface'">
        <div class="flex min-w-0 items-center gap-4">
          <BrandMark size="sm" v-if="phase !== 'call'" class="hidden shrink-0 sm:inline-flex" />
          <div class="min-w-0">
            <h1 class="truncate text-[14px] font-medium leading-5" :class="phase === 'call' ? 'text-white' : 'text-ink'">{{ session.scenarioTitle }}</h1>
            <p class="truncate text-[12px] leading-4" :class="phase === 'call' ? 'text-white/75' : 'text-muted'">역할수행 · 상대역 {{ counterpart.name }} {{ counterpart.position }}</p>
          </div>
        </div>
        <div v-if="phase === 'call'" class="flex shrink-0 items-center gap-3">
          <span class="text-[16px] font-semibold tabular-nums" :class="remaining <= 120 ? 'text-stageAlert' : 'text-white'" role="timer"><span class="sr-only">남은 시간 </span>{{ label }}</span>
          <button @click="submit" :disabled="phase !== 'call' || submitting || sending" class="h-11 rounded-control bg-white px-4 text-[14px] font-medium text-ink hover:bg-stageInk disabled:opacity-50 md:h-9">
            {{ submitting ? '채점 중...' : '면담 종료·제출' }}
          </button>
        </div>
      </header>

      <p v-if="errorMessage" :class="phase === 'call' ? 'fixed inset-x-0 top-14 z-50 mx-auto w-fit max-w-[90%] rounded-control bg-negative px-4 py-2 text-[13px] text-white' : 'border-b border-line bg-surface px-4 py-2 text-[13px] text-negative'" role="alert">{{ errorMessage }}</p>

      <!-- 과제 숙지 -->
      <main v-if="phase === 'prep'" class="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col p-4">
        <PrepPanel
          :session-id="sessionId"
          :scenario="scenario"
          :remaining-label="label"
          :can-start="!starting && !requesting"
          :media-error="mediaError"
          :stream="mediaStream"
          :requesting="requesting"
          :show-skip="demoSkip"
          @start="startFromPrep"
          @skip="startFromPrep"
          @retry-media="checkDevices"
          @leave="leave"
        />
      </main>

      <p v-else-if="phase === 'loading'" class="mt-24 text-center text-[14px] text-muted">불러오는 중...</p>

      <!-- 권한 요청: 카메라·마이크 스트림이 있어야 면담에 들어간다 -->
      <div v-else-if="phase === 'permission'" class="flex flex-1 items-start justify-center px-4 py-10 sm:items-center">
        <div class="w-full max-w-lg rounded-card border border-line bg-surface p-6">
          <h2 class="mb-1 text-[18px] font-semibold text-ink">카메라·마이크 확인</h2>
          <p v-if="permissionWarning" class="mb-2 text-[14px] font-medium text-negative" role="alert">{{ permissionWarning }}</p>
          <p class="mb-4 text-[13px] leading-5 text-muted">
            역할수행은 영상통화 형식으로 진행되며, 평가를 위해 표정과 음성 특징을 분석합니다.<br />
            면담 영상을 녹화해 제출 후 서버로 보내 시선·표정 분석에 사용합니다. 면담 중에는 얼굴 이미지 정보와 음량·발화 시간 같은 수치도 서버로 보냅니다.
          </p>
          <div class="relative mb-4 aspect-video overflow-hidden rounded-card bg-stage">
            <video ref="gateVideoRef" autoplay muted playsinline class="h-full w-full -scale-x-100 object-cover"></video>
            <p v-if="requesting" class="absolute inset-0 flex items-center justify-center px-6 text-[13px] text-white/85">카메라와 마이크를 확인하는 중...</p>
            <p v-else-if="!mediaStream" class="absolute inset-0 flex items-center justify-center px-6 text-[13px] text-white/75">미리보기를 불러오지 못했습니다</p>
          </div>
          <p v-if="mediaError" class="mb-4 text-[14px] leading-6 text-negative">{{ mediaError }}</p>
          <div class="flex flex-col gap-2 sm:flex-row">
            <button @click="retryFromPermission" :disabled="requesting" class="h-11 rounded-control bg-primary px-5 text-[14px] font-medium text-white hover:bg-primaryHover disabled:opacity-50 md:h-10">다시 요청</button>
            <button @click="leave" class="h-11 rounded-control btn-2 px-5 text-[14px] font-medium text-ink md:h-10">홈으로</button>
          </div>
        </div>
      </div>

      <!-- 면담 영상 업로드: 제출은 이미 끝났고, 녹화본을 서버로 보내는 중이다 -->
      <div v-else-if="phase === 'upload'" class="flex flex-1 items-start justify-center px-4 py-10 sm:items-center">
        <div class="w-full max-w-lg rounded-card border border-line bg-surface p-6" role="status" aria-live="polite">
          <h2 class="mb-1 text-[18px] font-semibold text-ink">{{ uploadFailed ? '영상 업로드에 실패했습니다' : '면담 영상을 업로드하는 중입니다' }}</h2>
          <p class="mb-4 text-[13px] leading-5 text-muted">
            답안 제출은 완료되었습니다. 영상은 시선·표정 분석에 사용되며, 올리지 못해도 영상 없이 채점됩니다.
          </p>
          <template v-if="!uploadFailed">
            <div class="mb-2 h-2 overflow-hidden rounded-chip bg-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="Math.round(uploadProgress * 100)" aria-label="영상 업로드 진행률">
              <div class="h-full bg-accent transition-[width] duration-200" :style="{ width: `${Math.round(uploadProgress * 100)}%` }"></div>
            </div>
            <p class="text-[13px] tabular-nums text-ink">{{ Math.round(uploadProgress * 100) }}%</p>
            <p class="mt-3 text-[14px] font-medium text-ink">창을 닫지 마세요.</p>
          </template>
          <template v-else>
            <p class="mb-4 text-[14px] leading-6 text-negative" role="alert">{{ uploadError }}</p>
            <div class="flex flex-col gap-2 sm:flex-row">
              <button @click="uploadPending" class="h-11 rounded-control bg-primary px-5 text-[14px] font-medium text-white hover:bg-primaryHover md:h-10">다시 업로드</button>
              <button @click="skipUpload" class="h-11 rounded-control btn-2 px-5 text-[14px] font-medium text-ink md:h-10">영상 없이 계속</button>
            </div>
          </template>
        </div>
      </div>

      <!-- 면담: 영상통화가 뷰포트 전체를 채우고, 헤더와 왼쪽 채팅이 그 위에 겹친다 -->
      <div v-else-if="phase === 'call'" class="group fixed inset-0 z-40 overflow-hidden bg-stage" :class="chatOpen ? 'chat-open' : ''" data-testid="call-stage">
        <CounterpartAvatar :name="counterpart.name" :position="counterpart.position" :speaking="aiSpeaking" :thinking="sending" />

        <!-- 채팅 오버레이: 헤더 아래부터 끝까지, 왼쪽 35%(좁은 화면은 넓게, 접기 가능) -->
        <div :class="chatOpen ? '' : 'max-lg:hidden'" class="absolute bottom-0 left-0 top-12 z-20 w-[85%] sm:w-[50%] lg:w-[35%]">
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
        <button @click="chatOpen = !chatOpen" class="absolute bottom-3 left-3 z-30 h-11 rounded-control border border-white/40 bg-stage/85 px-4 text-[14px] font-medium text-white lg:hidden" :class="chatOpen ? 'hidden' : ''">채팅 열기</button>
        <button v-if="chatOpen" @click="chatOpen = false" class="absolute left-[calc(85%-2.75rem)] top-14 z-30 flex h-11 w-11 items-center justify-center rounded-control bg-stage/85 text-[18px] text-white sm:left-[calc(50%-2.75rem)] lg:hidden" aria-label="채팅 접기">×</button>

        <div class="absolute bottom-3 right-3 z-30 aspect-video w-64 overflow-hidden rounded-card border border-white/60 bg-stageRaised transition-opacity sm:w-[26rem]" :class="chatOpen ? 'max-sm:pointer-events-none max-sm:opacity-0' : ''" data-testid="self-view">
          <video ref="selfVideoRef" autoplay muted playsinline class="h-full w-full -scale-x-100 object-cover"></video>
          <span class="absolute left-1.5 top-1.5 rounded-chip bg-black/60 px-1.5 py-0.5 text-[12px] text-white">나</span>
          <div class="absolute inset-x-1.5 bottom-1.5 h-1 overflow-hidden rounded-chip bg-black/50" title="마이크 레벨">
            <div class="h-full bg-stageOk transition-[width] duration-150" :style="{ width: `${Math.round(audio.level.value * 100)}%` }"></div>
          </div>
        </div>

        <div class="pointer-events-none absolute right-3 top-14 z-30 flex flex-col items-end gap-1 text-[12px]" :class="chatOpen ? 'max-sm:hidden' : ''">
          <span class="flex items-center gap-1.5 rounded-chip bg-black/60 px-2 py-0.5 text-white"><span class="h-1.5 w-1.5 rounded-full bg-stageOk"></span>카메라·마이크 켜짐</span>
          <span v-if="recorder.recording.value" class="flex items-center gap-1.5 rounded-chip bg-black/60 px-2 py-0.5 text-white" data-testid="recording-indicator"><span class="h-1.5 w-1.5 animate-pulse rounded-full bg-stageAlert"></span>녹화 중</span>
          <span v-if="face.unavailable.value" class="rounded-chip bg-stageWarnBg px-2 py-0.5 text-stageWarnFg">표정 분석 사용 불가</span>
          <span v-else-if="face.loading.value" class="rounded-chip bg-black/60 px-2 py-0.5 text-white">표정 분석 준비 중...</span>
          <span v-else-if="face.label.value" class="rounded-chip bg-black/60 px-2 py-0.5 text-white">표정: {{ emotionName(face.label.value) }}</span>
          <span v-if="audio.unavailable.value" class="rounded-chip bg-stageWarnBg px-2 py-0.5 text-stageWarnFg">음성 분석 사용 불가</span>
        </div>
      </div>
    </div>

    <p v-else class="mt-24 text-center text-[14px] text-muted">불러오는 중...</p>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import BrandMark from '../components/ui/BrandMark.vue';
import CallChatOverlay from '../components/CallChatOverlay.vue';
import CounterpartAvatar from '../components/CounterpartAvatar.vue';
import PrepPanel from '../components/PrepPanel.vue';
import { EMOTION_LABELS, useFaceEmotion } from '../composables/useFaceEmotion';
import { useAudioFeatures } from '../composables/useAudioFeatures';
import { useHeadPose } from '../composables/useHeadPose';
import { useInterviewRecorder } from '../composables/useInterviewRecorder';
import { useMediaCapture } from '../composables/useMediaCapture';
import { useRoute, useRouter } from 'vue-router';
import { deleteRecording, getSession, sendTurn, startCall as startCallApi, startPrep, submitSession, uploadRecording } from '../api/acdc';
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
const headPose = useHeadPose();
const recorder = useInterviewRecorder();
let speakingTimer = null;

// 제출 뒤 녹화본 업로드. Blob은 업로드가 끝나거나 포기할 때까지 들고 있는다(카메라는 제출 직후 끈다).
const uploadProgress = ref(0);
const uploadFailed = ref(false);
const uploadError = ref('');
let pendingRecording = null;
const warnBeforeUnload = (event) => {
  event.preventDefault();
  event.returnValue = '';
};

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
  recorder.start(mediaStream.value); // 이미 녹화 중이면 그대로 둔다(같은 페이지 재진입 시 중복 방지)
  const video = selfVideoRef.value;
  if (video && video.readyState < 2) {
    await new Promise((resolve) => video.addEventListener('loadeddata', resolve, { once: true }));
  }
  headPose.start(selfVideoRef.value); // 표정 전송과 별개로 머리 자세 측정을 계속한다
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
  headPose.dispose();
  audio.stop();
  stopMedia();
};

const leave = () => {
  recorder.discard();
  stopCapture();
  router.push('/home');
};

const scenario = computed(() => session.value?.scenario || {});
const counterpart = computed(() => scenario.value.counterpart || {});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const speechSupported = Boolean(SpeechRecognition);
let recognition = null;
let baseDraft = '';
// 음성 인식이 채운 그대로의 글. 보내는 시점에 입력창이 이와 같으면 VOICE, 고쳤거나 직접 입력했으면 TEXT다.
let voiceDraft = null;

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
    // 인식 전에 직접 쓴 글이 섞여 있으면 음성만의 발화가 아니므로 TEXT로 둔다.
    voiceDraft = baseDraft ? null : draft.value;
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
    const inputMode = voiceDraft !== null && text === voiceDraft.trim() ? 'VOICE' : 'TEXT';
    const res = await sendTurn(sessionId, text, inputMode);
    messages.value.push({ speaker: 'USER', text: res.userTurn.text }, { speaker: 'AI', text: res.aiTurn.text });
    speakFor(res.aiTurn.text);
    draft.value = '';
    voiceDraft = null;
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
    headPose.stop();
    // 녹화 종료를 기다려 Blob을 확정한 뒤 제출한다. 업로드는 제출 이후라 길어져도 시간 만료로 끊기지 않는다.
    const recording = await recorder.stop().catch(() => null);
    await audio.flush();
    const frontendFeatures = headPose.getFeatures(); // 유효 샘플이 30초 미만이면 {}
    await submitSession(sessionId, { recordingExpected: Boolean(recording), frontendFeatures });
    stopCapture();
    if (recording) {
      pendingRecording = recording;
      await uploadPending(true);
    } else {
      goSubmitted();
    }
  } catch (error) {
    errorMessage.value = error.message || '제출에 실패했습니다.';
    submitting.value = false;
  }
};

const goSubmitted = () => {
  router.replace({ path: '/submitted', query: { session: sessionId } });
};

// 제출이 끝난 뒤 녹화본을 올린다. 실패해도 제출은 유효하므로 다시 올리거나 영상 없이 계속할 수 있다.
const uploadPending = async (first = false) => {
  if (!pendingRecording) return goSubmitted();
  if (first === true) phase.value = 'upload';
  uploadFailed.value = false;
  uploadError.value = '';
  uploadProgress.value = 0;
  window.addEventListener('beforeunload', warnBeforeUnload);
  try {
    await uploadRecording(sessionId, pendingRecording.blob, pendingRecording.filename, (ratio) => {
      uploadProgress.value = ratio;
    });
    pendingRecording = null;
    recorder.discard();
    window.removeEventListener('beforeunload', warnBeforeUnload);
    goSubmitted();
  } catch (error) {
    window.removeEventListener('beforeunload', warnBeforeUnload);
    uploadFailed.value = true;
    uploadError.value = error.message || '영상을 업로드하지 못했습니다.';
  }
};

const skipUpload = async () => {
  pendingRecording = null;
  recorder.discard();
  try {
    await deleteRecording(sessionId); // 서버가 업로드를 기다리지 않고 바로 채점하게 한다
  } catch {
    // 실패해도 이동은 막지 않는다(서버가 업로드 대기 시간 뒤에 채점을 시작한다)
  }
  goSubmitted();
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
    // 새 세션은 phase가 null이고 시나리오에 숙지 시간이 있으면 여기서 숙지를 시작한다(서버가 시각을 기록).
    const prepPending = data.phase == null && data.status === 'READY' && Number(data.scenario?.prepMinutes) > 0;
    if (data.phase === 'PREP' || prepPending) {
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
  window.removeEventListener('beforeunload', warnBeforeUnload);
  recorder.discard();
  stopCapture();
});
</script>
