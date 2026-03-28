import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "scores.iplt20.com",
      },
      {
        protocol: "https",
        hostname: "documents.iplt20.com",
      },
      {
        protocol: "https",
        hostname: "bcci-stats-sports-mechanic.s3.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
