/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          blue: {
            DEFAULT: '#3b82f6',
            hover: '#2563eb',
            glow: '#60a5fa',
          },
          purple: {
            DEFAULT: '#8b5cf6',
            hover: '#7c3aed',
            glow: '#a78bfa',
          },
          cyan: {
            DEFAULT: '#06b6d4',
            hover: '#0891b2',
            glow: '#22d3ee',
          },
          bgDark: '#080c14',
          bgLight: '#f4f6fa',
          cardDark: 'rgba(15, 23, 42, 0.45)',
          cardLight: 'rgba(255, 255, 255, 0.65)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
        'float': 'float 6s infinite ease-in-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', filter: 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.5))' },
          '50%': { opacity: '1', filter: 'drop-shadow(0 0 30px rgba(59, 130, 246, 0.8))' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
