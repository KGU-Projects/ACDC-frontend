/** @type {import('tailwindcss').Config} */
// 주의: 실제 런타임 설정은 index.html의 Tailwind CDN 인라인 설정이다. 이 파일과 항상 같은 값으로 유지한다.
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Pretendard Variable"', 'Pretendard', 'system-ui', 'sans-serif']
      },
      colors: {
        /* 디자인 토큰(값은 src/style.css의 :root 변수) */
        ground: 'var(--ground)',
        surface: 'var(--surface)',
        rail: 'var(--rail)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        faint: 'var(--faint)',
        line: 'var(--line)',
        rule: 'var(--rule)',
        control: 'var(--control)',
        dash: 'var(--dash)',
        primary: 'var(--primary)',
        primaryHover: 'var(--primary-hover)',
        secondary: 'var(--secondary)',
        secondaryHover: 'var(--secondary-hover)',
        track: 'var(--track)',
        active: 'var(--active)',
        accent: 'var(--accent)',
        accentTint: 'var(--accent-tint)',
        accentLine: 'var(--accent-line)',
        hover: 'var(--hover)',
        topbar: 'var(--topbar)',
        positive: 'var(--positive)',
        negative: 'var(--negative)',
        /* 통화·숙지 화면의 어두운 무대 색 */
        stage: 'rgb(var(--stage-rgb) / <alpha-value>)',
        stagePanel: 'var(--stage-panel)',
        stageRaised: 'var(--stage-raised)',
        stageInk: 'var(--stage-ink)',
        stageAlert: 'var(--stage-alert)',
        stageOk: 'var(--stage-ok)',
        stageWarnBg: 'var(--stage-warn-bg)',
        stageWarnFg: 'var(--stage-warn-fg)'
      },
      borderRadius: {
        card: '8px',
        control: '6px',
        chip: '4px'
      }
    }
  },
  plugins: []
};
