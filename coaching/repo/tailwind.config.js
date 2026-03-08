/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 900: '#1e3a5f' },
        band: {
          developing: '#ef4444',
          proficient: '#eab308',
          elite: '#22c55e',
        },
      },
    },
  },
  plugins: [],
};
