/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design System màu
        primary: {
          50:  '#f0eeff',
          100: '#e0ddff',
          200: '#c5beff',
          300: '#a99dff',
          400: '#8b7cf8',
          500: '#6c63ff',  // Primary
          600: '#5a4fe6',
          700: '#4a40c0',
          800: '#3b329a',
          900: '#2e2778',
        },
        accent: {
          400: '#38e8ff',
          500: '#00d4ff',  // Cyan accent
          600: '#00b8e0',
        },
        dark: {
          50:  '#e8e8f0',
          100: '#d1d1e1',
          200: '#a3a3c3',
          300: '#7575a5',
          400: '#4a4a87',
          500: '#1e1e3f',
          600: '#1a1a2e',  // Surface
          700: '#141428',
          800: '#0e0e1e',
          900: '#0a0a14',
          950: '#070710',  // Background
        },
        game: '#ff6b6b',   // Màu cho game account
        vps:  '#6c63ff',   // Màu cho VPS
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #6c63ff 0%, #00d4ff 100%)',
        'gradient-dark':    'linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)',
        'gradient-card':    'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(108, 99, 255, 0.4)',
        'glow-accent':  '0 0 20px rgba(0, 212, 255, 0.4)',
        'card':         '0 8px 32px rgba(0, 0, 0, 0.3)',
        'card-hover':   '0 16px 48px rgba(108, 99, 255, 0.2)',
      },
      animation: {
        'fade-in':     'fadeIn 0.3s ease-in-out',
        'slide-up':    'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-slow':  'pulse 3s infinite',
        'float':       'float 6s ease-in-out infinite',
        'shimmer':     'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
