/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0D0D0D',
        surface: '#1A1A1A',
        card: '#252525',
        gold: '#D4AF37',
        'gold-light': '#F5D77A',
        text: '#FAFAFA',
        muted: '#9E9E9E',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
