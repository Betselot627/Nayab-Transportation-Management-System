/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class", // Enable class-based dark mode (add 'dark' class to html element)
  theme: {
    extend: {
      // You can extend theme here if needed
    },
  },
  plugins: [],
};
