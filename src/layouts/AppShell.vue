<template>
  <div class="min-h-screen bg-ground md:flex">
    <!-- 데스크톱 사이드바 -->
    <aside class="hidden md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col border-r border-line bg-rail">
      <SideNavContent :items="mainItems" :ft-item="ftItem" :is-active="isActive" :badge-for="badgeFor" :user="user" @logout="handleLogout" />
    </aside>

    <!-- 모바일 상단 바 -->
    <header class="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-line bg-rail px-4 md:hidden">
      <RouterLink to="/home" aria-label="평가 홈으로"><BrandMark /></RouterLink>
      <button
        type="button"
        class="-mr-2 flex h-11 w-11 items-center justify-center rounded-control text-ink hover:bg-line"
        aria-label="메뉴 열기"
        :aria-expanded="sheetOpen"
        @click="sheetOpen = true"
      >
        <AppIcon name="menu" :size="20" />
      </button>
    </header>

    <!-- 모바일 전체 시트 -->
    <div v-if="sheetOpen" class="fixed inset-0 z-40 flex flex-col bg-rail md:hidden" role="dialog" aria-modal="true" aria-label="메뉴">
      <div class="flex h-12 shrink-0 items-center justify-between border-b border-line px-4">
        <BrandMark />
        <button
          type="button"
          class="-mr-2 flex h-11 w-11 items-center justify-center rounded-control text-ink hover:bg-line"
          aria-label="메뉴 닫기"
          @click="sheetOpen = false"
        >
          <AppIcon name="close" :size="20" />
        </button>
      </div>
      <SideNavContent :items="mainItems" :ft-item="ftItem" :is-active="isActive" :badge-for="badgeFor" :user="user" :show-brand="false" mobile @logout="handleLogout" />
    </div>

    <main class="min-w-0 flex-1">
      <div class="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppIcon from '../components/ui/AppIcon.vue';
import BrandMark from '../components/ui/BrandMark.vue';
import SideNavContent from './SideNavContent.vue';
import { getStoredUser, logout } from '../api/auth';

// inProgressCount: 진행 중인 세션 수. 0이면 배지를 그리지 않는다(채우는 쪽은 Task 2).
const props = defineProps({
  inProgressCount: { type: Number, default: 0 }
});

const route = useRoute();
const router = useRouter();
const user = getStoredUser();
const sheetOpen = ref(false);

const mainItems = [
  { label: '평가 홈', to: '/home', icon: 'home' },
  { label: '평가 과제', to: '/tasks', icon: 'file' },
  { label: '나의 응시 내역', to: '/records', icon: 'clock', badge: true },
  { label: '역량 분석 결과', to: '/results', icon: 'chart' },
  { label: '평가 이용 안내', to: '/guide', icon: 'book' },
  { label: '자주 묻는 질문', to: '/faq', icon: 'help' }
];

const ftItem = computed(() => (user?.role === 'FT' ? { label: 'FT 검토', to: '/ft/review', icon: 'shield' } : null));

const isActive = (item) => {
  const p = route.path;
  if (item.to === '/results') return p === '/results' || p.startsWith('/results/') || p.startsWith('/result/');
  return p === item.to || p.startsWith(`${item.to}/`);
};

const badgeFor = (item) => (item.badge && props.inProgressCount > 0 ? props.inProgressCount : 0);

const handleLogout = async () => {
  await logout();
  sheetOpen.value = false;
  router.push('/login');
};

watch(() => route.fullPath, () => { sheetOpen.value = false; });
</script>
