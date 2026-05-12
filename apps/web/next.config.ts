import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ['@paystack/pax'],
  // Turbopack (used by `next dev` in Next.js 16+) has its own resolver and
  // doesn't need the webpack module resolution override below.
  turbopack: {},
  webpack(config) {
    // Ensure packages like tailwindcss are always resolved from this app's
    // node_modules, even when webpack's context is set to a parent directory.
    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),
      'node_modules',
    ];
    return config;
  },
};

export default nextConfig;
