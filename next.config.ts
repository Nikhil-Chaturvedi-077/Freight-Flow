import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16: Partial Prerendering / Cache Components
  // cacheComponents: true,

  // Typed routes
  // typedRoutes: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.neon.tech",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
    ],
  },

  // Turbopack
  turbopack: {},
};

export default nextConfig;