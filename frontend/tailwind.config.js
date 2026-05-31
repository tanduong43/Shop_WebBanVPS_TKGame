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
        'shake-dice':  'shakeDice 0.5s ease-in-out infinite',
        'spin-slow':   'spin 3s linear infinite',
        'bounce-in':   'bounceIn 0.5s cubic-bezier(0.68,-0.55,0.27,1.55)',
        'scale-in':    'scaleIn 0.25s ease-out',
        'ping-once':   'ping 0.5s ease-out 1',
        'bowl-cover':  'bowlCover 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'bowl-uncover': 'bowlUncover 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
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
        shakeDice: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg) scale(1)' },
          '10%':      { transform: 'translate(-4px, -4px) rotate(-5deg) scale(1.05)' },
          '20%':      { transform: 'translate(4px, -4px) rotate(5deg) scale(1.08)' },
          '30%':      { transform: 'translate(-4px, 4px) rotate(-3deg) scale(1.05)' },
          '40%':      { transform: 'translate(4px, 4px) rotate(3deg) scale(1.08)' },
          '50%':      { transform: 'translate(-2px, -6px) rotate(-6deg) scale(1.1)' },
          '60%':      { transform: 'translate(6px, -2px) rotate(6deg) scale(1.08)' },
          '70%':      { transform: 'translate(-6px, 2px) rotate(-4deg) scale(1.05)' },
          '80%':      { transform: 'translate(2px, 6px) rotate(4deg) scale(1.03)' },
          '90%':      { transform: 'translate(-2px, -2px) rotate(-2deg) scale(1)' },
        },
        bounceIn: {
          '0%':   { transform: 'scale(0.3)', opacity: '0' },
          '60%':  { transform: 'scale(1.1)', opacity: '1' },
          '80%':  { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
        scaleIn: {
          '0%':   { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bowlCover: {
          '0%':   { transform: 'translateY(-100px) scale(1.2)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        bowlUncover: {
          '0%':   { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-150px) scale(1.2)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
