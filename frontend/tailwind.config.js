/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        'funky': ['DinoWorld', 'cursive'],
      },
      colors: {
        brand: {
          pink: '#FF7396',
          yellow: '#FCCB30',
          orange: '#FF8048',
          purple: '#C980DB',
          teal: '#00BEAE',
          blue: '#00AFC7',
        }
      }
    },
  },
  plugins: [],
}