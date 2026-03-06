/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}"
  ],
  theme: {
    fill: {
      gray: ({ theme }) => theme('colors.gray')
    }
  },
  plugins: [],
  darkMode: ['selector', '[data-mode="dark"]']
}

