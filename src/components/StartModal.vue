<template>
  <Modal :open="!!scenario" :title="scenario ? scenario.title : ''" @close="requestClose">
    <fieldset class="space-y-2" :disabled="starting">
      <legend class="mb-2 text-[13px] text-muted">응시 방식</legend>

      <label class="flex cursor-pointer items-start gap-3 rounded-control border px-3 py-3" :class="mode === 'PRACTICE' ? 'border-accent bg-ground' : 'border-line'">
        <input v-model="mode" type="radio" name="start-mode" value="PRACTICE" class="mt-1 accent-accent" />
        <span>
          <span class="block text-[14px] font-medium text-ink">연습</span>
          <span class="block text-[13px] text-muted">횟수 제한 없이 응시합니다. 채점이 끝나면(최대 1시간 이내) 결과를 확인할 수 있습니다.</span>
        </span>
      </label>

      <label
        class="flex items-start gap-3 rounded-control border px-3 py-3"
        :class="[mode === 'REAL' ? 'border-accent bg-ground' : 'border-line', realTaken ? 'cursor-not-allowed' : 'cursor-pointer']"
      >
        <input v-model="mode" type="radio" name="start-mode" value="REAL" :disabled="realTaken" class="mt-1 accent-accent" aria-describedby="start-real-desc" />
        <span>
          <span class="block text-[14px] font-medium" :class="realTaken ? 'text-faint' : 'text-ink'">실전</span>
          <span id="start-real-desc" class="block text-[13px]" :class="realTaken ? 'text-faint' : 'text-muted'">
            {{ realTaken ? '이 과제는 이미 실전으로 응시했습니다. 실전은 과제당 1회만 가능합니다.' : '과제당 1회, 일시정지 없음, 결과는 공개 시각에 확인' }}
          </span>
        </span>
      </label>
    </fieldset>

    <p v-if="error" class="mt-3 text-[13px] text-negative" role="alert">{{ error }}</p>

    <template #footer>
      <button
        type="button"
        class="h-11 rounded-control border border-control bg-surface px-4 text-[14px] font-medium text-ink hover:bg-ground disabled:opacity-50 md:h-10"
        :disabled="starting"
        @click="emit('close')"
      >취소</button>
      <button
        type="button"
        class="h-11 rounded-control bg-primary px-4 text-[14px] font-medium text-white hover:bg-primaryHover disabled:opacity-60 md:h-10"
        :disabled="starting"
        @click="submit"
      >{{ starting ? '시작하는 중…' : '시작하기' }}</button>
    </template>
  </Modal>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import Modal from './ui/Modal.vue';

const props = defineProps({
  scenario: { type: Object, default: null },
  sessions: { type: Array, default: () => [] },
  starting: { type: Boolean, default: false },
  error: { type: String, default: '' }
});
const emit = defineEmits(['close', 'confirm']);

const mode = ref('PRACTICE');
// 화면 표시용 안내일 뿐이다. 최종 판단은 서버가 한다.
const realTaken = computed(() => !!props.scenario && props.sessions.some((s) => s.scenarioId === props.scenario.id && s.mode === 'REAL'));

watch(() => props.scenario, () => { mode.value = 'PRACTICE'; });

const requestClose = () => {
  if (!props.starting) emit('close');
};
const submit = () => {
  if (props.starting) return;
  emit('confirm', realTaken.value ? 'PRACTICE' : mode.value);
};
</script>
