import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      // Girly pastel theme — "if Ariana Grande and Hello Kitty made an app."
      // Token NAMES are unchanged on purpose: every component references
      // these by name (bg-card, text-clay, border-line, etc.), so only the
      // hex values below change and the entire app re-skins with zero markup,
      // layout, or font changes. Roles are preserved too (clay is still "the
      // primary accent," sage is still "the success/done color," etc.) — just
      // recolored — so contrast and meaning stay consistent everywhere.
      colors: {
        sand: "#fdeef6", // page background — soft cotton-candy pink
        card: "#fffafd", // card surface — near-white with a pink whisper, lighter than page
        line: "#f6d3e6", // hairlines / borders — soft pink
        ink: "#5a3a55", // primary text — deep plum (readable, not pure black)
        muted: "#9c7191", // secondary text — muted mauve
        clay: "#d24b91", // primary accent — vivid candy pink (links, primary buttons)
        "clay-light": "#e174ac", // hover state — lighter pink
        sage: "#9f88d4", // success / "done" accent — soft lavender (distinct from the pink)
        "sage-light": "#b7a4e2",
        blush: "#f4a9cd", // tertiary accent — bubblegum pastel pink, used sparingly
        sesame: "#f6e3a0", // neutral accent — buttery pastel yellow
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        // Pink-tinted card shadow (was warm-brown), matching the new plum/pink
        // palette so shadows read as soft pink depth rather than muddy brown.
        card: "0 1px 2px rgba(210,75,145,0.05), 0 8px 24px -12px rgba(210,75,145,0.16)",
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
