/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          dark: "#0f172a", // main background
          card: "#1e293b", // card/drawer background
          border: "#334155", // card and table borders
          hover: "#334155/50",
          base: "#f8fafc",
          subtle: "#f1f5f9",
          overlay: "#ffffff",
          "border-subtle": "#f8fafc",
          "border-strong": "#cbd5e1",
          "dark-base": "#090d16",
          "dark-card": "#0f172a",
          "dark-border": "#1e293b",
        },
        brand: {
          50: "#eef2ff",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          primary: "#2563eb",
          "primary-hover": "#1d4ed8",
          "primary-light": "#eff6ff",
          secondary: "#0ea5e9",
          "secondary-hover": "#0284c7",
          accent: "#6366f1",
          dark: "#07111f",
        },
        status: {
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444",
          info: "#0ea5e9",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        "card-hover": "0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)",
        floating: "0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)",
        dropdown: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
        drawer: "-10px 0 30px -5px rgba(0, 0, 0, 0.15)",
      },
      borderRadius: {
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        pill: "9999px",
      },
      transitionDuration: {
        150: "150ms",
        200: "200ms",
      },
      keyframes: {
        dropdownRollDown: {
          "0%": { opacity: 0, transform: "translateY(-12px) scaleY(0.9)" },
          "100%": { opacity: 1, transform: "translateY(0) scaleY(1)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.95)", boxShadow: "0 0 0 0 rgba(59, 130, 246, 0.7)" },
          "70%": { transform: "scale(1)", boxShadow: "0 0 0 10px rgba(59, 130, 246, 0)" },
          "100%": { transform: "scale(0.95)", boxShadow: "0 0 0 0 rgba(59, 130, 246, 0)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-simple": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "typing-bounce": {
          "0%, 80%, 100%": { transform: "scale(0.6)", opacity: "0.4" },
          "40%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        dropdown: "dropdownRollDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-ring": "pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fade-in 0.2s ease-out forwards",
        "fade-in-simple": "fade-in-simple 0.2s ease-out forwards",
        "slide-in-right": "slide-in-right 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "typing-bounce": "typing-bounce 1.4s infinite ease-in-out both",
      },
    },
  },
  corePlugins: {
    preflight: false, // Prevents Tailwind from resetting Bootstrap / existing CSS
  },
  plugins: [],
};
