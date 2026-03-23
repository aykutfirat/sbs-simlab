/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          bg: '#0a0e1a',
          panel: '#111827',
          border: '#1e293b',
          accent: '#f59e0b',
          gold: '#fbbf24',
          success: '#22c55e',
          warning: '#f97316',
          danger: '#ef4444',
          text: '#e2e8f0',
          muted: '#94a3b8',
        }
      }
    },
  },
  plugins: [],
}
