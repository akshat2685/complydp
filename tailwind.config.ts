import type { Config } from "tailwindcss";

/**
 * Pramaan design tokens — "The Registry" aesthetic.
 * Warm paper, ink text, hairline rules, serif display type,
 * monospace for evidence/ids, one signature vermilion seal-red.
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#f6f4ee",
          deep: "#efebe1",
          panel: "#fffdf8",
        },
        ink: {
          DEFAULT: "#1c1a17",
          soft: "#3d3831",
          muted: "#6f675c",
          faint: "#a39e93",
        },
        hairline: {
          DEFAULT: "#e5dfd2",
          strong: "#d3cbb6",
        },
        seal: {
          DEFAULT: "#a33327",
          dark: "#7e251c",
          bg: "#f9e9e5",
        },
        teal: {
          DEFAULT: "#0e5c55",
          dark: "#0a443f",
          bg: "#e4efec",
        },
        status: {
          amber: "#b45309",
          amberBg: "#faf0dc",
          red: "#b91c1c",
          redBg: "#fbe7e3",
          green: "#1d7a4f",
          greenBg: "#e2f2e8",
          blue: "#46617c",
          blueBg: "#e9edf1",
        },
      },
      fontFamily: {
        display: ["var(--font-plex-serif)", "Georgia", '"Times New Roman"', "serif"],
        sans: [
          "var(--font-plex-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "var(--font-plex-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(28, 26, 23, 0.05)",
        raised: "0 4px 14px -4px rgba(28, 26, 23, 0.12)",
        drawer: "-8px 0 32px rgba(28, 26, 23, 0.14)",
      },
    },
  },
  plugins: [],
};

export default config;
