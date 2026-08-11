import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@financeapp/shared-types"],
};

export default nextConfig;
