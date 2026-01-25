/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        game: ['Bangers', 'cursive'],              // For titles/headers
        marker: ['Permanent Marker', 'cursive'],   // For buttons/UI
        brush: ['Caveat Brush', 'cursive'],        // For body text (optional)
      },
      colors: {
        'neon-blue': '#74aaee',
        'cyber-purple': '#8100c8',
        'game-yellow': '#f8e692',
        'hot-pink': '#ff00d6',
      }
    },
  },
  plugins: [],
}