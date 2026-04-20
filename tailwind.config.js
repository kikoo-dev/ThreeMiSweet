/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'clairmont-gold': '#c7a07a',
        'clairmont-brown': '#a98973',
        'clairmont-cream': '#fdfce8',
        'clairmont-beige': '#e2ceb1',
        'clairmont-dark': '#3a3a3a',
        'clairmont-light': '#F9FAFB',
      },
      fontFamily: {
        'spectral': ['"Spectral"', 'serif'],
        'dmsans': ['"DM Sans"', 'sans-serif'],
        'playfair': ['"Playfair Display"', 'serif'],
        'poppins': ['Poppins', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
