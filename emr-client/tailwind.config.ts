import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          '"SF Pro Display"',
          "var(--font-inter)",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
        inter: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          "var(--font-inter)",
          "sans-serif",
        ],
        outfit: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          "var(--font-inter)",
          "sans-serif",
        ],
        mono: [
          '"SF Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "var(--font-jetbrains)",
          "Menlo",
          "monospace",
        ],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--card-border)",
        divider: "var(--divider-color)",
        input: "var(--input-bg)",
        sidebar: "var(--sidebar-bg)",
        card: {
          DEFAULT: "var(--card-bg)",
          foreground: "var(--text-primary)",
          border: "var(--card-border)",
        },
        muted: {
          DEFAULT: "var(--text-muted)",
          foreground: "var(--text-secondary)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          glow: "var(--primary-glow)",
        },
      },
    },
  },
  plugins: [animate],
};
export default config;
