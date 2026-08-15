import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'fn-dark': '#0a0a0f',
        'fn-darker': '#050508',
        'fn-card': '#12121a',
        'fn-card-hover': '#1a1a25',
        'fn-border': '#2a2a3a',
        'fn-purple': '#9b59f0',
        'fn-purple-light': '#b07cff',
        'fn-blue': '#00d4ff',
        'fn-blue-light': '#33ddff',
        'fn-gold': '#ffc800',
        'fn-yellow': '#ffdd00',
        'fn-green': '#00ff88',
        'fn-red': '#ff3355',
        'fn-orange': '#ff8833',
        'fn-pink': '#ff55aa',
        'fn-white': '#e8e8f0',
        'fn-gray': '#6a6a80',
      },
      fontFamily: {
        'display': ['Rajdhani', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'slide-right': 'slide-right 0.3s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-right': {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'shimmer-gradient': 'linear-gradient(90deg, transparent, rgba(155,89,240,0.1), transparent)',
      },
    },
  },
  plugins: [],
}
export default config
