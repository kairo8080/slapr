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
        ink: "#101113",
        panel: "#191B1F",
        line: "#2B2F36",
        mint: "#63F1B5",
        signal: "#F8D35A",
        danger: "#FF6D7A",
        sky: "#7DD3FC"
      },
      boxShadow: {
        glow: "0 24px 80px rgba(99, 241, 181, 0.14)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
