import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        sand: "#f6efdf", // page background
        card: "#fbf7ee", // card surface, slightly lighter than page
        line: "#e3d7c0", // hairlines / borders
        ink: "#4a3f36", // primary text — warm charcoal, not pure black
        muted: "#96876f", // secondary text
        clay: "#785b4e", // primary accent — deep warm brown
        "clay-light": "#866a5b",
        sage: "#7a816c", // secondary accent — muted green
        "sage-light": "#8e967d",
        blush: "#d68d84", // tertiary accent — soft pink, used sparingly
        sesame: "#cfbb9f", // neutral accent
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(74,63,54,0.04), 0 8px 24px -12px rgba(74,63,54,0.12)",
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
