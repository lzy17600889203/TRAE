/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0b0d12',
        panel: '#11141b',
        panel2: '#161b25',
        neon: '#00ffa3',
        glitch: '#ff2d6e',
        amber: '#ff8a00',
        violet: '#7c5cff',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
        'scan': 'scan 4s linear infinite',
        'flicker': 'flicker 0.14s steps(2) infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(0,255,163,0.0)' },
          '50%': { boxShadow: '0 0 32px 0 rgba(0,255,163,0.35)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        flicker: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};
