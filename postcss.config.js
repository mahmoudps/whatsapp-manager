module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    "postcss-preset-env": {
      features: {
        "nesting-rules": true,
        "custom-properties": true,
        "custom-media-queries": true,
        "media-query-ranges": true,
      },
    },
    "postcss-import": {},
    "postcss-nested": {},
    "postcss-custom-media": {},
    "postcss-custom-properties": {},
    "postcss-flexbugs-fixes": {},
    "postcss-normalize": {},
  },
}
