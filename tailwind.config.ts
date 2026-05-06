import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        panel: "rgb(var(--color-panel) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)",
        brand: "rgb(var(--color-brand) / <alpha-value>)",
        signal: "rgb(var(--color-signal) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
        sky: "rgb(var(--color-sky) / <alpha-value>)"
      },
      boxShadow: {
        glow: "0 0 0 1px rgb(var(--color-brand) / 0.55)"
      },
      fontFamily: {
        sans: [
          "SFMono-Regular",
          "Consolas",
          "Liberation Mono",
          "Menlo",
          "ui-monospace",
          "monospace"
        ]
      }
    }
  },
  plugins: []
};

export default config;
