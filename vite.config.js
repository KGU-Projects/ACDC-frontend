import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendBaseUrl = env.VITE_BACKEND_BASE_URL;

  return {
    plugins: [vue()],
    server: {
      host: '0.0.0.0',
      proxy: backendBaseUrl
        ? {
            '/api': {
              target: backendBaseUrl,
              changeOrigin: true,
              secure: false,
              headers: {
                'ngrok-skip-browser-warning': 'true'
              }
            }
          }
        : undefined
    }
  };
});
