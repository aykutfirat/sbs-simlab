/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        war: {
          bg: '#0b0f1a',
          panel: '#111827',
          border: '#1e293b',
          accent: '#6366f1',
          blue: '#3b82f6',
          purple: '#a855f7',
          green: '#22c55e',
          red: '#ef4444',
          orange: '#f97316',
          text: '#e2e8f0',
          muted: '#94a3b8',
        }
      }
    },
  },
  plugins: [],
}
