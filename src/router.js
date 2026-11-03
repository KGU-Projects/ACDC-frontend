import { createRouter, createWebHistory } from 'vue-router';

import SignupView from './pages/SignupView.vue';
import HomeView from './pages/HomeView.vue';
import OAuthSuccessView from './pages/OAuthSuccessView.vue';
import LoginView from './pages/LoginView.vue';
import InBasketView from './pages/InBasketView.vue';
import RolePlayView from './pages/RolePlayView.vue';
import ResultView from './pages/ResultView.vue';
import SubmittedView from './pages/SubmittedView.vue';
import ReviewView from './pages/ReviewView.vue';
import TasksView from './pages/TasksView.vue';
import RecordsView from './pages/RecordsView.vue';
import ResultsView from './pages/ResultsView.vue';
import GuideView from './pages/GuideView.vue';
import FaqView from './pages/FaqView.vue';
import { getStoredUser } from './api/auth';

// meta.layout: 'shell'(사이드바), 'focus'(상단 바만), 'bare'(기본, 래퍼 없음)
// 서류함·역할수행·제출 완료는 아직 각 페이지가 자체 전체 화면 틀을 쓰므로 Task 4에서 'focus'로 바꾼다.
const routes = [
  { path: '/', redirect: '/login' },

  { path: '/login', name: 'login', component: LoginView, meta: { layout: 'bare' } },
  { path: '/signup', name: 'signup', component: SignupView, meta: { layout: 'bare' } },
  { path: '/oauth-success', name: 'oauth-success', component: OAuthSuccessView, meta: { layout: 'bare' } },

  { path: '/home', name: 'home', component: HomeView, meta: { requiresAuth: true, layout: 'shell' } },
  { path: '/tasks', name: 'tasks', component: TasksView, meta: { requiresAuth: true, layout: 'shell' } },
  { path: '/records', name: 'records', component: RecordsView, meta: { requiresAuth: true, layout: 'shell' } },
  { path: '/results', name: 'results', component: ResultsView, meta: { requiresAuth: true, layout: 'shell' } },
  { path: '/guide', name: 'guide', component: GuideView, meta: { requiresAuth: true, layout: 'shell' } },
  { path: '/faq', name: 'faq', component: FaqView, meta: { requiresAuth: true, layout: 'shell' } },
  { path: '/inbasket/:id', name: 'inbasket', component: InBasketView, meta: { requiresAuth: true, layout: 'bare' } },
  { path: '/roleplay/:id', name: 'roleplay', component: RolePlayView, meta: { requiresAuth: true, layout: 'bare' } },
  { path: '/submitted', name: 'submitted', component: SubmittedView, meta: { requiresAuth: true, layout: 'bare' } },
  { path: '/result/:id', name: 'result', component: ResultView, meta: { requiresAuth: true, layout: 'shell' } },
  { path: '/ft/review', name: 'ft-review', component: ReviewView, meta: { requiresAuth: true, requiresFT: true, layout: 'shell' } },

  { path: '/:pathMatch(.*)*', redirect: '/login' }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to) => {
  const hasAccessToken = Boolean(localStorage.getItem('accessToken'));

  if (to.meta.requiresAuth && !hasAccessToken) {
    return '/login';
  }

  if (to.meta.requiresFT && getStoredUser()?.role !== 'FT') {
    return '/home';
  }

  if ((to.name === 'login' || to.name === 'signup') && hasAccessToken) {
    return '/home';
  }

  return true;
});

export default router;
