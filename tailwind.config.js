/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        "surface-muted": "var(--surface-muted)",
        border: "var(--border)",
        "accent-coral": "var(--accent-coral)",
        "accent-teal": "var(--accent-teal)",
        "accent-gold": "var(--accent-gold)",
        "accent-plum": "var(--accent-plum)",
      },
    },
  },
  plugins: [],
};
