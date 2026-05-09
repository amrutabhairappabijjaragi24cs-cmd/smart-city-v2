/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['"Exo 2"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
        display: ['"Orbitron"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
