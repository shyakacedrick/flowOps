/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B1120',
        primary: '#3B82F6',
        secondary: '#06B6D4',
      },
      fontFamily: {
        sans: [
          'Inter',
          'Manrope',
          'Satoshi',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(59, 130, 246, 0.45)',
        'glow-lg': '0 0 80px -10px rgba(59, 130, 246, 0.55)',
        'glow-cyan': '0 0 40px -10px rgba(6, 182, 212, 0.45)',
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'slide-up': 'slideUp 0.7s ease-out forwards',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px -5px rgba(59,130,246,0.4)' },
          '50%': { boxShadow: '0 0 40px 0px rgba(59,130,246,0.7)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};
