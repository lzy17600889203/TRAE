/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './client/index.html',
    './client/src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'cyber-dark': '#0a0e1a',
        'cyber-blue': '#00d4ff',
        'cyber-green': '#00ff88',
        'cyber-red': '#ff4757',
        'cyber-yellow': '#ffd32a',
        'cyber-purple': '#a55eea'
      },
      animation: {
        'pulse-node': 'pulse-node 0.5s ease-out',
        'flow-path': 'flow-path 2s linear infinite',
        'wither': 'wither 0.5s ease-out forwards',
        'highlight-grow': 'highlight-grow 0.3s ease-out',
        'expand-collapse': 'expand-collapse 0.3s ease-out'
      },
      keyframes: {
        'pulse-node': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.3)', opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        'flow-path': {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' }
        },
        'wither': {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0.3', transform: 'scale(0.9)' }
        },
        'highlight-grow': {
          '0%': { transform: 'scale(1)', boxShadow: '0 0 0 rgba(0,212,255,0)' },
          '50%': { transform: 'scale(1.1)', boxShadow: '0 0 20px rgba(0,212,255,0.8)' },
          '100%': { transform: 'scale(1)', boxShadow: '0 0 0 rgba(0,212,255,0)' }
        },
        'expand-collapse': {
          '0%': { opacity: '0', maxHeight: '0' },
          '100%': { opacity: '1', maxHeight: '1000px' }
        }
      }
    }
  },
  plugins: []
}
