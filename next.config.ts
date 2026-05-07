import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  devIndicators: false,
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-neon"]
};

export default nextConfig;
