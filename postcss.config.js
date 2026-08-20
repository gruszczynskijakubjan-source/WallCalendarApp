module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // Safari 12 has no `gap` support in flexbox (only grid). Tailwind's
    // `gap-*` utilities compile to plain `gap`, used pervasively across
    // components on flex containers — this polyfills it via margins instead
    // of hand-converting every occurrence to space-x/y-* (risky: depends on
    // flex direction and breaks with flex-wrap).
    "flex-gap-polyfill": {},
  },
};
