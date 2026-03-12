/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  safelist: [
    // Dynamic color classes used in feature grids (prevent Tailwind purge)
    ...['blue', 'emerald', 'amber', 'purple', 'cyan', 'rose', 'indigo'].flatMap(c => [
      `border-${c}-500/40`, `border-${c}-400/30`,
      `bg-gradient-to-br`, `from-${c}-900/20`, `to-${c}-800/10`,
      `text-${c}-400`, `text-${c}-300`, `text-${c}-500`,
      `bg-${c}-500/10`, `bg-${c}-500/15`, `bg-${c}-500/20`,
      `shadow-${c}-500/20`, `shadow-${c}-500/30`,
    ]),
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        heading: ['var(--font-space-grotesk)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        body: ['var(--font-dm-sans)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          blue: "#3B82F6",
          neon: "#60A5FA",
        },
        // New premium dark palette
        bg: '#0a0a0f',
        surface: '#111118',
        surface2: '#1a1a24',
        border: '#2a2a3a',
        accent: '#6c63ff',
        accent2: '#00d4aa',
        danger: '#ff4757',
        warning: '#ffa502',
        success: '#2ed573',
        txt: '#e8e8f0',
        txt2: '#8888aa',
        txt3: '#555570',
      },
      animation: {
        breath: "breath 5s ease-in-out infinite",
        fadeIn: "fadeIn 0.6s ease-out forwards",
        shimmer: 'shimmer 2s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        aurora: 'aurora 60s linear infinite',
        'marquee': 'marquee 30s linear infinite',
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
        shimmer: {
          from: { backgroundPosition: '0 0' },
          to: { backgroundPosition: '-200% 0' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: 1, boxShadow: '0 0 8px currentColor' },
          '50%': { opacity: 0.4, boxShadow: '0 0 2px currentColor' },
        },
        'slide-up': {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: 0, transform: 'translateX(10px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        aurora: {
          from: { backgroundPosition: '50% 50%, 50% 50%' },
          to: { backgroundPosition: '350% 50%, 350% 50%' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};
