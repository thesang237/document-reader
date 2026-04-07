/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'academia': {
          bg: '#1a0f08',
          paper: '#2c2118',
          text: '#d4c3a3',
          accent: '#b38b4d',
          gold: '#d4af37',
          burgundy: '#4a2c2a',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        body: ['Crimson Text', 'serif'],
      },
    },
  },
  plugins: [],
}
