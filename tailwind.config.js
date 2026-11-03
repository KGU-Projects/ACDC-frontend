/** @type {import('tailwindcss').Config} */
// 주의: 실제 런타임 설정은 index.html의 Tailwind CDN 인라인 설정이다. 이 파일과 항상 같은 값으로 유지한다.
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
          fontFamily: {
            sans: ['"Pretendard Variable"', 'Pretendard', 'system-ui', 'sans-serif']
          },
          colors: {
            /* 새 디자인 토큰(값은 src/style.css의 :root 변수) */
            ground: 'var(--ground)',
            surface: 'var(--surface)',
            rail: 'var(--rail)',
            ink: 'var(--ink)',
            muted: 'var(--muted)',
            faint: 'var(--faint)',
            line: 'var(--line)',
            rule: 'var(--rule)',
            control: 'var(--control)',
            primary: 'var(--primary)',
            primaryHover: 'var(--primary-hover)',
            accent: 'var(--accent)',
            positive: 'var(--positive)',
            negative: 'var(--negative)',
            /* 기존 색: 아직 재스타일되지 않은 화면이 쓴다(Task 5에서 제거) */
            brand: '#10B981',
            brandHover: '#059669',
            brandLight: '#D1FAE5',
            brandBg: '#F0FDF4'
          },
          borderRadius: {
            card: '8px',
            control: '6px',
            chip: '4px'
          }
        },
  },
  plugins: [],
}
