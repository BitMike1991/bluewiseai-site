/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        brand: {
          blue: "#3B82F6",
          neon: "#60A5FA",
        },
      },
      animation: {
        breath: "breath 5s ease-in-out infinite",
        fadeIn: "fadeIn 0.6s ease-out forwards",
      },
      keyframes: {
        breath: {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "0.95" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
