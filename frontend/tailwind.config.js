/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#05080d",
          dark: "#080c12",
          card: "#0f1520",
          panel: "rgba(11, 16, 24, 0.75)",
          border: "rgba(255, 255, 255, 0.08)",
        },
        signal: {
          emerald: "#10b981",
          crimson: "#ef4444",
          cyan: "#06b6d4",
          amber: "#f59e0b",
        }
      },
      fontFamily: {
        display: ['Syne', 'Outfit', 'sans-serif'],
        sans: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.15)',
        'glow-crimson': '0 0 20px rgba(239, 68, 68, 0.15)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.15)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
