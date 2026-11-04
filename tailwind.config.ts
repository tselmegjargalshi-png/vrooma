import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    container: { center: true, padding: { DEFAULT: "1rem", md: "1.5rem", lg: "2rem" }, screens: { "2xl": "1360px" } },
    extend: {
      colors: {
        ink: { DEFAULT: "#0B0B0D", 900: "#0B0B0D", 800: "#131417", 700: "#1B1D21", 600: "#25282D", 500: "#3A3E45" },
        bone: { DEFAULT: "#F6F5F2", 50: "#FBFAF8", 100: "#F6F5F2", 200: "#ECEAE5", 300: "#DCD9D2" },
        steel: { 400: "#8B9098", 500: "#6B7078", 600: "#50545B" },
        brass: { DEFAULT: "#B8925A", 300: "#D7BC8E", 400: "#C7A36D", 500: "#B8925A", 600: "#9A7744", 700: "#7A5E36" },
        ok: "#2F8F5B",
        warn: "#C2841E",
        bad: "#B4443A",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Manrope", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,11,13,.04), 0 8px 24px -12px rgba(11,11,13,.12)",
        lift: "0 2px 4px rgba(11,11,13,.06), 0 20px 40px -20px rgba(11,11,13,.25)",
      },
      keyframes: { pan: { from: { transform: "scale(1.02) translateX(-2%)" }, to: { transform: "scale(1.14) translateX(2%)" } }, fadein: { from: { opacity: "0", transform: "translateY(4px)" }, to: { opacity: "1", transform: "none" } } },
      animation: { fadein: "fadein .25s ease-out both" },
    },
  },
  plugins: [],
} satisfies Config;
