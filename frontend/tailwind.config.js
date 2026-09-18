/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        koda: {
          bg: 'var(--koda-bg)',
          surface: 'var(--koda-surface)',
          panel: 'var(--koda-panel)',
          border: 'var(--koda-border)',
          'border-hover': 'var(--koda-border-hover)',
          text: 'var(--koda-text)',
          'text-secondary': 'var(--koda-text-secondary)',
          accent: 'var(--koda-accent)',
          'accent-hover': 'var(--koda-accent-hover)',
          success: 'var(--koda-success)',
          warning: 'var(--koda-warning)',
          error: 'var(--koda-error)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
