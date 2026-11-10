/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: '#14532D',
        emerald: { DEFAULT: '#16A34A', 600: '#15803D' },
        mint: '#DCFCE7',
        ink: '#1E293B',
        muted: '#64748B',
        canvas: '#F8FAFC',
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.05)',
        lift: '0 8px 30px rgba(20,83,45,0.15)',
      },
      keyframes: {
        fadeUp: { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'none' } },
        slideIn: { '0%': { opacity: 0, transform: 'translateX(16px)' }, '100%': { opacity: 1, transform: 'none' } },
      },
      animation: { fadeUp: 'fadeUp .4s ease both', slideIn: 'slideIn .25s ease both' },
    },
  },
  plugins: [],
};
