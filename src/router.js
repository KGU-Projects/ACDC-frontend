import { createRouter, createWebHistory } from 'vue-router';

// pages 폴더 안의 컴포넌트들 로드
import SignupView from './pages/SignupView.vue';
import InterviewView from './pages/InterviewView.vue';
import PopupView from './pages/PopupView.vue';
import ReportView from './pages/ReportView.vue';
import ReportDetailView from './pages/ReportDetailView.vue';
import HomeView from './pages/HomeView.vue';
import InterviewSetupView from './pages/InterviewSetupView.vue';
import JobSelectView from './pages/JobSelectView.vue';
import MyPageView from './pages/MyPageView.vue';
import OAuthSuccessView from './pages/OAuthSuccessView.vue';
import LoginView from './pages/LoginView.vue';

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  
  { path: '/login', name: 'login', component: LoginView },
  { path: '/oauth-success', name: 'oauth-success', component: OAuthSuccessView },
  { path: '/job-select', name: 'job-select', component: JobSelectView, meta: { requiresAuth: true } },
  { path: '/interview-setup', name: 'interview-setup', component: InterviewSetupView, meta: { requiresAuth: true } },
  { path: '/home', name: 'home', component: HomeView, meta: { requiresAuth: true } },
  { path: '/mypage', name: 'mypage', component: MyPageView, meta: { requiresAuth: true } },
  { path: '/interview', name: 'interview', component: InterviewView, meta: { requiresAuth: true } },
  { path: '/popup', name: 'popup', component: PopupView, meta: { requiresAuth: true } },
  { path: '/signup', name: 'signup', component: SignupView },
  { path: '/report', name: 'report', component: ReportView, meta: { requiresAuth: true } },
  { path: '/report/:sessionId', name: 'report-detail', component: ReportDetailView, meta: { requiresAuth: true } },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
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

  if ((to.name === 'login' || to.name === 'signup') && hasAccessToken) {
    return '/home';
  }

  return true;
});

export default router;
