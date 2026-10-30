/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        plum: {
          50:  '#f7f4f9',
          100: '#ede7f5',
          200: '#d9ccea',
          300: '#bea8d8',
          400: '#9f7fc0',
          500: '#7f5aa5',
          600: '#5e3f7e',
          700: '#4a2f65',
          800: '#3a234f',
          900: '#2b173b',
          950: '#1a0d24',
        },
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'serif'],
        sans:  ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
