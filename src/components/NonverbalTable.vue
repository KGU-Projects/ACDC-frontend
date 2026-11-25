<template>
  <section v-if="rows.length" class="rounded-card border border-line bg-surface" aria-labelledby="nonverbal-title">
    <div class="flex items-baseline justify-between gap-3 px-5 pb-2 pt-5 md:px-6">
      <h2 id="nonverbal-title" class="text-[16px] font-semibold text-ink">비언어 분석</h2>
      <span class="text-[12px] text-muted">면담 영상에서 측정한 값</span>
    </div>
    <table class="w-full text-left text-[14px]">
      <thead>
        <tr class="border-b border-line text-[12px] text-muted">
          <th scope="col" class="px-5 py-2 font-normal md:px-6">항목</th>
          <th scope="col" class="px-5 py-2 text-right font-normal md:px-6">값</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-rule">
        <tr v-for="row in rows" :key="row.key">
          <td class="px-5 py-2.5 text-ink md:px-6">{{ row.label }}</td>
          <td class="px-5 py-2.5 text-right tabular-nums text-ink md:px-6">{{ row.value }}<span v-if="row.unit" class="ml-0.5 text-[12px] text-muted">{{ row.unit }}</span></td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { NONVERBAL_LABELS } from '../composables/stage';

// features: { key: number } (결과 응답의 nonverbalFeatures, 없으면 null)
const props = defineProps({ features: { type: Object, default: null } });

const format = (value) => (typeof value === 'number' && Number.isFinite(value) ? String(Math.round(value * 100) / 100) : String(value));

// 알려진 항목은 정해진 순서로, 모르는 키는 그 뒤에 이름 그대로 보여 준다.
const rows = computed(() => {
  const entries = props.features && typeof props.features === 'object' ? props.features : {};
  const known = Object.keys(NONVERBAL_LABELS).filter((key) => entries[key] != null);
  const unknown = Object.keys(entries).filter((key) => !(key in NONVERBAL_LABELS) && entries[key] != null);
  return [...known, ...unknown].map((key) => ({
    key,
    label: NONVERBAL_LABELS[key]?.label || key,
    unit: NONVERBAL_LABELS[key]?.unit || '',
    value: format(typeof entries[key] === 'number' ? entries[key] * (NONVERBAL_LABELS[key]?.scale || 1) : entries[key])
  }));
});
</script>
