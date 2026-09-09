import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#7A1F3D",
          dark: "#5E1730",
          light: "#94355A",
        },
        secondary: {
          DEFAULT: "#D4A24C",
          dark: "#B8863A",
        },
        background: "#F8F7F4",
        card: "#FFFFFF",
        ink: "#1F1F1F",
        muted: "#6B7280",
        success: "#15803D",
        warning: "#D97706",
        danger: "#DC2626",
        border: "#E5E7EB",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(31,31,31,0.08), 0 1px 2px -1px rgba(31,31,31,0.06)",
        lift: "0 4px 16px -4px rgba(122,31,61,0.18)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
