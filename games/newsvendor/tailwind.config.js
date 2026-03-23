/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bagel: {
          50: '#fdf8f0',
          100: '#f9edda',
          200: '#f2d7b0',
          300: '#e9bc7d',
          400: '#df9c4a',
          500: '#d6832e',
          600: '#c76a23',
          700: '#a5511f',
          800: '#854220',
          900: '#6c371d',
        },
        cream: {
          50: '#fefcf7',
          100: '#fdf6ea',
          200: '#faebd0',
          300: '#f5dba8',
        },
      },
    },
  },
  plugins: [],
}
