/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './entrypoints/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        memo: {
          yellow: '#FFFFA5',
          pink: '#FFD6E0',
          blue: '#D6EAFF',
          green: '#D6FFD6',
          orange: '#FFE4C4',
          purple: '#E8D6FF',
          mint: '#D6FFF0',
          peach: '#FFDAB9',
        },
      },
    },
  },
  plugins: [],
};
