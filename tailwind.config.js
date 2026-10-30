/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}", // pages 폴더와 내부 컴포넌트들을 전부 추적
  ],
  theme: {
    extend: {
      colors: {
        brand: '#10B981',       /* 메인 포인트 초록색 */
        brandHover: '#059669',  /* 호버 시 짙은 초록색 */
        brandLight: '#D1FAE5',  /* 상단 배경 연한 초록색 */
      }
    },
  },
  plugins: [],
}