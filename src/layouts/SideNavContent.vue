<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div v-if="showBrand" class="flex h-16 shrink-0 items-center px-5">
      <RouterLink to="/home" aria-label="평가 홈으로"><BrandMark /></RouterLink>
    </div>

    <nav aria-label="주 메뉴" class="flex-1 overflow-y-auto px-3 py-2">
      <ul class="space-y-0.5">
        <li v-for="item in items" :key="item.to">
          <NavRow :item="item" :active="isActive(item)" :badge="badgeFor(item)" :mobile="mobile" />
        </li>
      </ul>
    </nav>

    <div v-if="ftItem" class="px-3 pb-2">
      <div class="mb-2 border-t border-line"></div>
      <NavRow :item="ftItem" :active="isActive(ftItem)" :badge="0" :mobile="mobile" />
    </div>

    <div class="flex shrink-0 items-center gap-2 border-t border-line px-4 py-3">
      <div class="min-w-0 flex-1">
        <div class="truncate text-[14px] font-medium text-ink">{{ user?.name || '사용자' }}</div>
        <div v-if="user?.role === 'FT'" class="text-[12px] text-muted">FT</div>
      </div>
      <button
        type="button"
        class="flex h-11 w-11 items-center justify-center rounded-control text-muted hover:bg-line hover:text-ink md:h-9 md:w-9"
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
import BrandMark from '../components/ui/BrandMark.vue';
import NavRow from './NavRow.vue';

defineProps({
  items: { type: Array, required: true },
  ftItem: { type: Object, default: null },
  isActive: { type: Function, required: true },
  badgeFor: { type: Function, required: true },
  user: { type: Object, default: null },
  showBrand: { type: Boolean, default: true },
  mobile: { type: Boolean, default: false }
});
const emit = defineEmits(['logout']);
</script>
