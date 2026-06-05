import type { NextConfig } from "next";

const API_BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8787";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@protectedshare/contracts",
    "@protectedshare/crypto",
    "@protectedshare/ui",
    "@protectedshare/formatting"
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_BACKEND_URL}/api/:path*`
      }
    ];
  },
  async redirects() {
    return [
      {
        source: "/n",
        destination: "/notes",
        permanent: true
      },
      {
        source: "/n/:id",
        destination: "/notes/:id",
        permanent: true
      },
      {
        source: "/s",
        destination: "/secrets",
        permanent: true
      },
      {
        source: "/s/:id",
        destination: "/secrets/:id",
        permanent: true
      },
      {
        source: "/workspace",
        destination: "/notepad",
        permanent: true
      }
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on"
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload"
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN"
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin"
          }
        ]
      }
    ];
  }
};

export default nextConfig;

