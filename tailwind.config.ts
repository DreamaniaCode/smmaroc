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
        smm: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981", // Moroccan emerald primary
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        obsidian: {
          800: "#151e32",
          850: "#0f172a",
          900: "#0b1120",
          950: "#050811",
        },
        morocco: {
          red: "#c1272d",
          green: "#006233",
          gold: "#d4af37",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "emerald-glow": "radial-gradient(ellipse at top, rgba(16,185,129,0.15), transparent 70%)",
      },
    },
  },
  plugins: [],
};

export default config;
