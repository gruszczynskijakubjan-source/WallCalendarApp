const withTM = require("next-transpile-modules")(["date-fns"]);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
};

module.exports = withTM(nextConfig);
