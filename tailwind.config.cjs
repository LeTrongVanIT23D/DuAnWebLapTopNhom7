/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        body: ["Roboto", "sans-serif"],
      },
      colors: {
        primary: "#1846be",
      },
    },
  },
  plugins: [], // Đã xóa line-clamp vì nó có sẵn trong Tailwind v3.3+
};