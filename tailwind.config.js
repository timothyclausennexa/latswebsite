/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        'prison-black': '#0D0D0D',
        'alarm-red': '#9E3039',
        'warning-orange': '#FF8A00',
        'ash-white': '#E5E5E5',
      },
      fontFamily: {
        'pixel-heading': ['"Press Start 2P"', 'cursive'],
        'pixel-timer': ['"VT323"', 'monospace'],
        'body': ['"Roboto Mono"', 'monospace'],
      },
      boxShadow: {
        'pixel-sm': '2px 2px 0 #0D0D0D',
        'pixel-md': '4px 4px 0 #0D0D0D',
        'pixel-lg': '6px 6px 0 #0D0D0D',
        'pixel-xl': '8px 8px 0 #0D0D0D',
      },
      animation: {
        marquee: 'marquee 40s linear infinite'
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' }
        }
      }
    }
  },
  plugins: [],
}