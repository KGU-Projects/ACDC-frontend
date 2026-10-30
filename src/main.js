import { createApp } from 'vue';
import App from './App.vue';
import './style.css';
import router from './router'; // 방금 위에서 완성한 router.js 파일을 임포트

createApp(App).use(router).mount('#app');