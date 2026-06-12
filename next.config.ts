import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Add your image CDN domains here if needed
      // {
      //   protocol: 'https',
      //   hostname: 'example.com',
      // },
    ],
  },

  // Headers for security & performance
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Security headers
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Performance headers
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400",
          },
        ],
      },
      // Cache static assets aggressively
      {
        source: "/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Redirects if needed
  async redirects() {
    return [];
  },

  // Rewrites if needed
  async rewrites() {
    return {
      beforeFiles: [],
    };
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_NAME: "Sabana POS",
  },

  // TypeScript strict checks
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },

  // Production optimizations
  compress: true,
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
};

export default nextConfig;
