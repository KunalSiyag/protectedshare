import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@protectedshare/contracts",
    "@protectedshare/crypto",
    "@protectedshare/ui",
    "@protectedshare/formatting"
  ],
  async redirects() {
    return [
      {
        source: "/protected-text-alternative",
        destination: "/vs/protectedtext",
        permanent: true,
      },
      {
        source: "/secret-share",
        destination: "/notes",
        permanent: true,
      },
      {
        source: "/secure-text-sharing-link",
        destination: "/notes",
        permanent: true,
      },
      {
        source: "/share-password-securely",
        destination: "/notes",
        permanent: true,
      },
      {
        source: "/anonymous-chat-room",
        destination: "/chat",
        permanent: true,
      },
      {
        source: "/og-image.png",
        destination: "/og-image.jpg",
        permanent: true,
      },
      {
        source: "/envshare",
        destination: "/secrets",
        permanent: true,
      },
      {
        source: "/privnote",
        destination: "/vs/privnote",
        permanent: true,
      },
      {
        source: "/protectedtext",
        destination: "/vs/protectedtext",
        permanent: true,
      },
      {
        source: "/onetimesecret",
        destination: "/vs/onetimesecret",
        permanent: true,
      },
      {
        source: "/one-time-secret",
        destination: "/vs/onetimesecret",
        permanent: true,
      },
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
