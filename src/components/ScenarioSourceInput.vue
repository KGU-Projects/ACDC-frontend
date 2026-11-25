<template>
  <div class="space-y-3">
    <div>
      <label :for="`${idPrefix}-text`" class="mb-1 block text-[13px] font-medium text-ink">원문 붙여넣기</label>
      <textarea :id="`${idPrefix}-text`" :value="text" rows="6" :disabled="disabled" placeholder="과제의 바탕이 되는 글을 붙여넣으세요" class="w-full resize-y rounded-control border border-control bg-surface p-3 text-[14px] leading-6 text-ink placeholder:text-faint focus-visible:border-accent disabled:bg-ground" @input="emit('update:text', $event.target.value)"></textarea>
    </div>
    <div>
      <label :for="`${idPrefix}-files`" class="mb-1 block text-[13px] font-medium text-ink">PDF 업로드</label>
      <input :id="`${idPrefix}-files`" type="file" accept="application/pdf,.pdf" multiple :disabled="disabled" class="block w-full text-[13px] text-muted file:mr-3 file:h-9 file:rounded-control file:border-0 file:bg-secondary file:px-3 file:text-[13px] file:font-medium file:text-ink" @change="onFiles" />
      <ul v-if="files.length" class="mt-2 space-y-0.5 text-[12px] text-muted">
        <li v-for="f in files" :key="f.name + f.size">{{ f.name }} · {{ Math.max(1, Math.round(f.size / 1024)) }}KB</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
defineProps({
  text: { type: String, default: '' },
  files: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
  idPrefix: { type: String, default: 'source' }
});
const emit = defineEmits(['update:text', 'update:files']);

const onFiles = (event) => emit('update:files', [...(event.target.files || [])]);
</script>
