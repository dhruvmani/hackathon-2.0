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
        background: "#141414",
        surface: "#1f1f1f",
        border: "#2a2a2a",
        primary: {
          DEFAULT: "#E50914",
          hover: "#C40812",
        },
        muted: "#a3a3a3",
      },
      fontFamily: {
        bebas: ["var(--font-bebas)"],
        inter: ["var(--font-inter)"],
      },
      borderRadius: {
        lg: "0.5rem",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
    },
  },
  plugins: [],
};
export default config;
