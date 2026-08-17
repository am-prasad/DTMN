import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary — deep navy blue (trustworthy, academic)
        primary: {
          50: "#f0f4ff",
          100: "#e0e8ff",
          200: "#c7d4fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#1e3a5f",  // main
          600: "#1a3254",
          700: "#162a47",
          800: "#12223a",
          900: "#0e1b2d",
          DEFAULT: "#1e3a5f",
        },
        // Accent — warm amber (approachable, optimistic)
        accent: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#d97706",
          600: "#b45309",
          DEFAULT: "#d97706",
        },
        // Neutral greys
        neutral: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-merriweather)", "Georgia", "serif"],
      },
      fontSize: {
        "display": ["2.5rem", { lineHeight: "1.2", fontWeight: "700" }],
        "heading-1": ["2rem", { lineHeight: "1.25", fontWeight: "700" }],
        "heading-2": ["1.5rem", { lineHeight: "1.33", fontWeight: "600" }],
        "heading-3": ["1.25rem", { lineHeight: "1.4", fontWeight: "600" }],
      },
      spacing: {
        "section": "5rem",
        "section-sm": "3rem",
      },
      maxWidth: {
        "site": "1280px",
      },
      boxShadow: {
        "card": "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
        "card-hover": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
        "elevated": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
      },
      borderRadius: {
        "card": "0.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
