<template>
  <div class="bg-slate-50 min-h-screen p-3 sm:p-4">
    <div v-if="loadError" class="max-w-xl mx-auto mt-20 text-center">
      <p class="text-rose-500 font-bold mb-4">{{ loadError }}</p>
      <button @click="router.push('/home')" class="text-sm font-bold text-brand">홈으로</button>
    </div>

    <div v-else-if="session" class="max-w-7xl mx-auto flex flex-col h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-2rem)]">
      <header class="bg-white rounded-2xl shadow px-5 py-3 flex items-center justify-between mb-3">
        <div>
          <h1 class="text-base font-extrabold text-slate-800">{{ session.scenarioTitle }}</h1>
          <p class="text-[11px] text-slate-400">역할수행 · 상대역 {{ counterpart.name }} {{ counterpart.position }}</p>
        </div>
        <div class="flex items-center gap-3">
          <span v-if="phase === 'call'" class="font-mono text-lg font-bold" :class="remaining <= 120 ? 'text-rose-500' : 'text-slate-700'">{{ label }}</span>
          <button @click="submit" :disabled="phase !== 'call' || submitting || sending" class="bg-brand hover:bg-brandHover disabled:bg-slate-300 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">
            {{ submitting ? '채점 중...' : '면담 종료·제출' }}
          </button>
        </div>
      </header>

      <p v-if="errorMessage" class="mb-2 text-xs font-bold text-rose-500">{{ errorMessage }}</p>

      <!-- 시작 게이트: 카메라·마이크 확인 -->
      <div v-if="phase === 'gate'" class="flex-grow flex items-center justify-center min-h-0">
        <div class="bg-white rounded-2xl shadow p-6 w-full max-w-lg text-center">
          <h2 class="text-lg font-extrabold text-slate-800 mb-1">카메라·마이크 확인</h2>
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
            <button v-if="mediaError" @click="checkDevices" :disabled="requesting" class="bg-brand hover:bg-brandHover disabled:bg-slate-300 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">다시 시도</button>
            <button v-else @click="startCall" :disabled="!mediaStream" class="bg-brand hover:bg-brandHover disabled:bg-slate-300 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">면담 시작</button>
            <button @click="leave" class="bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">홈으로</button>
          </div>
        </div>
      </div>

      <div v-else class="flex-grow grid grid-cols-1 lg:grid-cols-5 gap-3 min-h-0">
        <section class="lg:col-span-2 bg-white rounded-2xl shadow p-5 overflow-y-auto text-sm text-slate-700 leading-relaxed min-h-0 max-h-60 lg:max-h-none">
          <div class="space-y-4">
            <a v-if="scenario.materialsPdf" :href="scenario.materialsPdf" target="_blank" rel="noopener" class="inline-block text-xs font-bold text-brand">과제 원본 PDF 보기 (새 탭)</a>
            <div v-if="scenario.situation"><h3 class="font-bold text-slate-800 mb-1">상황</h3><p class="whitespace-pre-wrap">{{ scenario.situation }}</p></div>
            <div v-if="scenario.participantRole"><h3 class="font-bold text-slate-800 mb-1">나의 역할</h3><p class="whitespace-pre-wrap">{{ scenario.participantRole }}</p></div>
            <div v-for="m in scenario.materials" :key="m.id" class="rounded-xl border border-slate-100 p-4">
              <h3 class="font-bold text-slate-800 mb-2">{{ m.title }}</h3>
              <p class="whitespace-pre-wrap">{{ m.body }}</p>
            </div>
          </div>
        </section>

        <section class="lg:col-span-3 flex flex-col gap-3 min-h-0">
          <!-- 영상통화 화면: 큰 화면=상대역, 작은 화면=나 -->
          <div class="relative rounded-2xl shadow overflow-hidden bg-slate-900 h-64 sm:h-80 lg:h-[46%] lg:min-h-[240px] shrink-0" data-testid="call-stage">
            <CounterpartAvatar :name="counterpart.name" :position="counterpart.position" :speaking="aiSpeaking" :thinking="sending" />

            <div class="absolute right-3 bottom-3 w-32 sm:w-44 aspect-video rounded-xl overflow-hidden border-2 border-white/70 shadow-lg bg-slate-800" data-testid="self-view">
              <video ref="selfVideoRef" autoplay muted playsinline class="w-full h-full object-cover -scale-x-100"></video>
              <span class="absolute left-1.5 top-1.5 text-[10px] font-bold text-white bg-black/45 rounded px-1.5 py-0.5">나</span>
              <div class="absolute left-1.5 right-1.5 bottom-1.5 h-1 rounded-full bg-black/40 overflow-hidden" title="마이크 레벨">
                <div class="h-full bg-emerald-400 transition-all duration-150" :style="{ width: `${Math.round(audio.level.value * 100)}%` }"></div>
              </div>
            </div>

            <div class="absolute right-3 top-3 flex flex-col items-end gap-1 text-[10px] font-bold">
              <span class="rounded-full px-2 py-0.5 bg-black/45 text-white">● 카메라·마이크 켜짐</span>
              <span v-if="face.unavailable.value" class="rounded-full px-2 py-0.5 bg-amber-500/85 text-white">표정 분석 사용 불가</span>
              <span v-else-if="face.loading.value" class="rounded-full px-2 py-0.5 bg-black/45 text-white">표정 분석 준비 중...</span>
              <span v-else-if="face.label.value" class="rounded-full px-2 py-0.5 bg-black/45 text-white">표정: {{ emotionName(face.label.value) }}</span>
              <span v-if="audio.unavailable.value" class="rounded-full px-2 py-0.5 bg-amber-500/85 text-white">음성 분석 사용 불가</span>
            </div>
          </div>

          <div class="flex-grow bg-white rounded-2xl shadow flex flex-col min-h-0">
            <div ref="logEl" class="flex-grow overflow-y-auto p-4 space-y-3 min-h-[120px]">
              <div v-for="(m, i) in messages" :key="i" class="flex" :class="m.speaker === 'USER' ? 'justify-end' : 'justify-start'">
                <div class="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap" :class="m.speaker === 'USER' ? 'bg-brand text-white' : 'bg-slate-100 text-slate-700'">
                  <span class="block text-[10px] font-bold opacity-70 mb-0.5">{{ m.speaker === 'USER' ? '나' : counterpart.name || '상대역' }}</span>
                  {{ m.text }}
                </div>
              </div>
              <p v-if="sending" class="text-xs text-slate-400">상대역이 답변을 준비하고 있습니다...</p>
            </div>

            <div class="border-t border-slate-100 p-4">
              <p v-if="listening" class="text-xs font-bold text-rose-500 mb-2">● 듣는 중... 말씀하세요</p>
              <p v-else-if="!speechSupported" class="text-xs text-slate-400 mb-2">이 브라우저는 음성 인식을 지원하지 않습니다(Chrome 권장). 텍스트로 입력하세요.</p>
              <div class="flex items-end gap-2">
                <textarea v-model="draft" rows="2" :disabled="submitting" @keydown.enter.exact.prevent="send" class="flex-grow resize-none rounded-xl bg-slate-50 border border-slate-200 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 p-3 text-sm" placeholder="발화를 입력하거나 마이크로 말한 뒤 확인·수정하세요 (Enter 전송)"></textarea>
                <button v-if="speechSupported" @click="toggleListening" :disabled="submitting || sending" class="shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-colors" :class="listening ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-brandLight hover:text-brand'" :title="listening ? '음성 입력 중지' : '음성 입력'">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-14 0m7 7v3m-4 0h8M12 3a3 3 0 00-3 3v5a3 3 0 006 0V6a3 3 0 00-3-3z"/></svg>
                </button>
                <button @click="send" :disabled="!draft.trim() || sending || submitting" class="shrink-0 bg-brand hover:bg-brandHover disabled:bg-slate-300 text-white text-sm font-bold px-4 h-11 rounded-xl transition-colors">전송</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <p v-else class="text-center text-slate-400 text-sm mt-20">불러오는 중...</p>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import CounterpartAvatar from '../components/CounterpartAvatar.vue';
import { EMOTION_LABELS, useFaceEmotion } from '../composables/useFaceEmotion';
import { useAudioFeatures } from '../composables/useAudioFeatures';
import { useMediaCapture } from '../composables/useMediaCapture';
import { useRoute, useRouter } from 'vue-router';
import { getSession, sendTurn, submitSession } from '../api/acdc';
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
const logEl = ref(null);
const { remaining, label, start: startCountdown, stop: stopCountdown } = useCountdown();

const phase = ref('gate'); // gate(카메라·마이크 확인) → call(면담 진행)
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

const startCall = async () => {
  if (!mediaStream.value) return;
  phase.value = 'call';
  await bindStream(selfVideoRef);
  startCountdown(session.value.remainingSeconds, submit);
  audio.start(mediaStream.value);
  const video = selfVideoRef.value;
  if (video && video.readyState < 2) {
    await new Promise((resolve) => video.addEventListener('loadeddata', resolve, { once: true }));
  }
  face.start(selfVideoRef.value);
  const last = messages.value[messages.value.length - 1];
  if (last?.speaker === 'AI') speakFor(last.text);
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

watch(
  () => messages.value.length,
  async () => {
    await nextTick();
    if (logEl.value) logEl.value.scrollTop = logEl.value.scrollHeight;
  }
);

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
    await checkDevices();
  } catch (error) {
    loadError.value = error.message || '세션을 불러오지 못했습니다.';
  }
});

onBeforeUnmount(() => {
  recognition?.abort();
  clearTimeout(speakingTimer);
  stopCapture();
});
</script>
