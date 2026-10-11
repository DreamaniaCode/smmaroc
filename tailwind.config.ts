import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        dark: {
          950: "#06080F",
          900: "#0B0F19",
          850: "#101626",
          800: "#161D31",
          700: "#222B45",
          600: "#2F3B5C",
        },
        primary: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981", // SMMaroc Emerald
          600: "#059669",
          700: "#047857",
        },
        accent: {
          cyan: "#06b6d4",
          indigo: "#6366f1",
          purple: "#a855f7",
          amber: "#f59e0b",
          rose: "#f43f5e",
        },
        social: {
          instagram: "#E1306C",
          tiktok: "#00F2FE",
          youtube: "#FF0000",
          telegram: "#229ED9",
          facebook: "#1877F2",
          twitter: "#1DA1F2",
          spotify: "#1DB954",
        },
      },
      boxShadow: {
        glow: "0 0 35px -5px rgba(16, 185, 129, 0.3)",
        "glow-indigo": "0 0 35px -5px rgba(99, 102, 241, 0.25)",
        card: "0 20px 40px -15px rgba(0, 0, 0, 0.5)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
