import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.ngrok-free.dev",
    "madisyn-germanous-unbravely.ngrok-free.dev",
  ],
  typedRoutes: true,
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
