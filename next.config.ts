import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  basePath: "/Poker-GTO-Trainer",
  assetPrefix: "/Poker-GTO-Trainer/",
};

export default nextConfig;