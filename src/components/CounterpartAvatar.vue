<template>
  <div class="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-700 to-slate-900 overflow-hidden select-none">
    <svg viewBox="0 0 200 240" class="h-[78%] max-h-[420px] w-auto" role="img" :aria-label="`${name || '상대역'} 아바타`">
      <!-- 몸/정장 -->
      <path d="M20 240 C20 190 55 170 100 170 C145 170 180 190 180 240 Z" fill="#334155" />
      <path d="M85 170 L100 205 L115 170 Z" fill="#f8fafc" />
      <path d="M100 178 L95 200 L100 215 L105 200 Z" fill="#6366f1" />
      <!-- 목 -->
      <rect x="88" y="145" width="24" height="30" rx="8" fill="#f1c9a5" />
      <!-- 머리카락(뒤) -->
      <path d="M52 95 C48 40 85 22 100 22 C115 22 152 40 148 95 C148 120 140 140 132 148 L68 148 C60 140 52 120 52 95 Z" fill="#1e1b2e" />
      <!-- 얼굴 -->
      <ellipse cx="100" cy="100" rx="42" ry="50" fill="#f6d3b3" />
      <!-- 머리카락(앞) -->
      <path d="M56 92 C58 52 82 38 100 38 C122 38 144 54 144 92 C128 70 112 62 100 62 C84 62 66 72 56 92 Z" fill="#1e1b2e" />
      <!-- 눈썹 -->
      <path d="M72 82 Q82 77 92 82" stroke="#1e1b2e" stroke-width="3" fill="none" stroke-linecap="round" />
      <path d="M108 82 Q118 77 128 82" stroke="#1e1b2e" stroke-width="3" fill="none" stroke-linecap="round" />
      <!-- 눈(깜빡임) -->
      <g class="eye-blink">
        <ellipse cx="82" cy="98" rx="5" ry="6" fill="#1e1b2e" />
        <ellipse cx="118" cy="98" rx="5" ry="6" fill="#1e1b2e" />
        <circle cx="84" cy="96" r="1.6" fill="#fff" />
        <circle cx="120" cy="96" r="1.6" fill="#fff" />
      </g>
      <!-- 볼 -->
      <ellipse cx="72" cy="118" rx="8" ry="5" fill="#f4a9a0" opacity="0.45" />
      <ellipse cx="128" cy="118" rx="8" ry="5" fill="#f4a9a0" opacity="0.45" />
      <!-- 코 -->
      <path d="M100 100 Q96 114 101 117" stroke="#d8a982" stroke-width="2" fill="none" stroke-linecap="round" />
      <!-- 입 -->
      <g v-if="speaking" class="mouth-talk">
        <ellipse cx="100" cy="133" rx="11" ry="7" fill="#7f1d1d" />
        <ellipse cx="100" cy="137" rx="6" ry="3" fill="#f87171" />
      </g>
      <path v-else d="M89 132 Q100 140 111 132" stroke="#b45353" stroke-width="3" fill="none" stroke-linecap="round" />
    </svg>

    <div class="absolute left-3 bottom-3 bg-black/45 text-white rounded-lg px-3 py-1.5 backdrop-blur-sm">
      <p class="text-sm font-bold leading-tight">{{ name || '상대역' }}</p>
      <p v-if="position" class="text-[10px] opacity-80 leading-tight">{{ position }}</p>
    </div>

    <div v-if="thinking" class="absolute top-3 left-3 flex items-center gap-1.5 bg-black/45 text-white text-xs font-bold rounded-full px-3 py-1">
      <span class="dot"></span><span class="dot"></span><span class="dot"></span>
      <span class="ml-1">생각 중</span>
    </div>
    <div v-else-if="speaking" class="absolute top-3 left-3 flex items-center gap-1.5 bg-emerald-500/80 text-white text-xs font-bold rounded-full px-3 py-1">
      <span class="w-2 h-2 rounded-full bg-white animate-pulse"></span>말하는 중
    </div>
  </div>
</template>

<script setup>
defineProps({
  name: { type: String, default: '' },
  position: { type: String, default: '' },
  speaking: { type: Boolean, default: false },
  thinking: { type: Boolean, default: false }
})
</script>

<style scoped>
.eye-blink { transform-origin: 100px 98px; animation: blink 4.5s infinite; }
@keyframes blink { 0%, 92%, 100% { transform: scaleY(1); } 95% { transform: scaleY(0.08); } }
.mouth-talk { transform-origin: 100px 133px; animation: talk 0.28s ease-in-out infinite alternate; }
@keyframes talk { from { transform: scaleY(0.35); } to { transform: scaleY(1.15); } }
.dot { width: 6px; height: 6px; border-radius: 9999px; background: #fff; animation: bounce 1s infinite; }
.dot:nth-child(2) { animation-delay: 0.15s; }
.dot:nth-child(3) { animation-delay: 0.3s; }
@keyframes bounce { 0%, 80%, 100% { opacity: 0.3; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }
</style>
