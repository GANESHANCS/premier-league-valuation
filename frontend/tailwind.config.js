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
          DEFAULT: "#0b0f19",
          dark: "#090d16",
          card: "#111827",
          panel: "rgba(17, 24, 39, 0.75)",
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
        sans: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.25)',
        'glow-crimson': '0 0 20px rgba(239, 68, 68, 0.25)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.25)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
}
