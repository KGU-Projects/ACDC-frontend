<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <nav aria-label="주 메뉴" class="flex-1 overflow-y-auto px-3 pb-4 pt-4">
      <div v-for="(group, gi) in groups" :key="group.label" :class="gi ? 'mt-5' : ''">
        <div :id="`navgroup-${gi}`" class="mb-1 px-3 text-[12px] text-faint">{{ group.label }}</div>
        <ul class="space-y-0.5" :aria-labelledby="`navgroup-${gi}`">
          <li v-for="item in group.items" :key="item.to">
            <NavRow :item="item" :active="isActive(item)" :badge="badgeFor(item)" :mobile="mobile" />
          </li>
        </ul>
      </div>
    </nav>

    <div v-if="showUser" class="flex shrink-0 items-center gap-2 border-t border-line px-4 py-3">
      <div class="min-w-0 flex-1">
        <div class="truncate text-[14px] font-medium text-ink">{{ user?.name || '사용자' }}</div>
        <div class="text-[12px] text-muted">{{ user?.role === 'FT' ? 'FT' : '참가자' }}</div>
      </div>
      <button
        type="button"
        class="flex h-11 w-11 items-center justify-center rounded-control text-muted hover:bg-line hover:text-ink"
        aria-label="로그아웃"
        title="로그아웃"
        @click="emit('logout')"
      >
        <AppIcon name="logout" :size="16" />
      </button>
    </div>
  </div>
</template>

<script setup>
import AppIcon from '../components/ui/AppIcon.vue';
import NavRow from './NavRow.vue';

defineProps({
  groups: { type: Array, required: true },
  isActive: { type: Function, required: true },
  badgeFor: { type: Function, required: true },
  user: { type: Object, default: null },
  showUser: { type: Boolean, default: false },
  mobile: { type: Boolean, default: false }
});
const emit = defineEmits(['logout']);
</script>
