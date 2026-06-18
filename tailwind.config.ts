import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          900: "#07060F",
          800: "#0C0B1A",
          700: "#111225",
          600: "#191630",
        },
        border: {
          DEFAULT: "rgba(120,160,220,0.12)",
          hi: "rgba(100,170,255,0.40)",
        },
        text: {
          hi: "#E8EEF8",
          mid: "#9FB0C9",
          low: "#5C6B85",
        },
        accent: {
          DEFAULT: "#3DA9FC",
          2: "#00E0FF",
        },
        purple: {
          DEFAULT: "#8B5CF6",
          hi: "#A78BFA",
          low: "#6D28D9",
        },
        success: "#36D399",
        danger: "#FF4D6D",
        warning: "#FFB454",
        rank: {
          E: "#6B7280",
          D: "#36D399",
          C: "#3DA9FC",
          B: "#A855F7",
          A: "#F5C04A",
          S: "#FF4D6D",
          SS: "#F0F6FF",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-rajdhani)", "var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        panel: "12px",
        inset: "8px",
      },
      spacing: {
        "0.5": "2px",
        "1.5": "6px",
        "2.5": "10px",
        "4.5": "18px",
      },
      boxShadow: {
        panel: "inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 32px rgba(0,0,0,0.55)",
        "panel-active": "inset 0 1px 0 rgba(255,255,255,0.05), 0 6px 40px rgba(0,0,0,0.65)",
        glow: "0 0 0 1px rgba(80,180,255,0.38), 0 0 28px rgba(61,169,252,0.28)",
        "glow-purple": "0 0 0 1px rgba(139,92,246,0.4), 0 0 28px rgba(139,92,246,0.25)",
        "glow-success": "0 0 0 1px rgba(54,211,153,0.38), 0 0 22px rgba(54,211,153,0.2)",
        "glow-warning": "0 0 0 1px rgba(255,180,84,0.4), 0 0 22px rgba(255,180,84,0.22)",
        "glow-danger": "0 0 0 1px rgba(255,77,109,0.4), 0 0 28px rgba(255,77,109,0.3)",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-150%)" },
          "100%": { transform: "translateX(150%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-3px)" },
        },
        "system-blink": {
          "0%, 92%, 100%": { opacity: "1" },
          "96%": { opacity: "0.2" },
        },
        "rank-pulse": {
          "0%, 100%": { filter: "brightness(1)" },
          "50%": { filter: "brightness(1.35)" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        scanline: "scanline 6s linear infinite",
        shimmer: "shimmer 2.5s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        "system-blink": "system-blink 4s ease-in-out infinite",
        "rank-pulse": "rank-pulse 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
