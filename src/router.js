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
import { getStoredUser } from './api/auth';

const routes = [
  { path: '/', redirect: '/login' },

  { path: '/login', name: 'login', component: LoginView },
  { path: '/signup', name: 'signup', component: SignupView },
  { path: '/oauth-success', name: 'oauth-success', component: OAuthSuccessView },

  { path: '/home', name: 'home', component: HomeView, meta: { requiresAuth: true } },
  { path: '/inbasket/:id', name: 'inbasket', component: InBasketView, meta: { requiresAuth: true } },
  { path: '/roleplay/:id', name: 'roleplay', component: RolePlayView, meta: { requiresAuth: true } },
  { path: '/submitted', name: 'submitted', component: SubmittedView, meta: { requiresAuth: true } },
  { path: '/result/:id', name: 'result', component: ResultView, meta: { requiresAuth: true } },
  { path: '/ft/review', name: 'ft-review', component: ReviewView, meta: { requiresAuth: true, requiresFT: true } },

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
