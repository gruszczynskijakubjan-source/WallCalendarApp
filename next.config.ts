import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Allows the dev server's HMR websocket to work when accessed through a
  // temporary public tunnel (e.g. Cloudflare quick tunnel / ngrok) instead
  // of localhost. Harmless in production, where this only matters in dev.
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default nextConfig;
