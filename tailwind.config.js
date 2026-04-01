/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#FEF6F0',
        surface:  '#FFFFFF',
        border:   '#F0E4DC',
        muted:    '#F7EDE7',
        text:     '#1C1018',
        subdued:  '#9B8890',
        urgency:  '#E8336A',
        success:  '#00B37A',
        warn:     '#F59E0B',
      },
      fontFamily: {
        heading: ['"Archivo Black"', 'sans-serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-rose': 'pulse-rose 1.5s ease-in-out infinite',
        'fade-in':    'fade-in 0.3s ease-out',
        'slide-up':   'slide-up 0.4s ease-out',
      },
      keyframes: {
        'pulse-rose': {
          '0%, 100%': { opacity: 1 },
          '50%':       { opacity: 0.4 },
        },
        'fade-in': {
          '0%':   { opacity: 0 },
          '100%': { opacity: 1 },
        },
        'slide-up': {
          '0%':   { transform: 'translateY(16px)', opacity: 0 },
          '100%': { transform: 'translateY(0)',    opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}
