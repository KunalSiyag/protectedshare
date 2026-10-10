import type { NextConfig } from "next";

// Google Analytics hosts, allowed only when NEXT_PUBLIC_GA_ID is set at build time.
const GA_SCRIPT_HOSTS = ["https://www.googletagmanager.com"];
const GA_IMG_HOSTS = ["https://*.google-analytics.com", "https://*.googletagmanager.com"];
const GA_CONNECT_HOSTS = [
  "https://*.google-analytics.com",
  "https://*.analytics.google.com",
  "https://*.googletagmanager.com",
];

/**
 * Content-Security-Policy for every route.
 *
 * 'unsafe-inline' stays in script-src because the App Router streams inline RSC bootstrap
 * scripts without nonces (and the theme script runs inline before paint). What this policy does
 * buy: scripts load only from this origin (plus Google Tag Manager when analytics is on), and
 * connect-src/img-src/form-action keep injected markup or script from sending data to other hosts.
 * Development adds 'unsafe-eval' (React dev tooling) and ws: (hot reload).
 */
export function contentSecurityPolicy({ dev, analytics }: { dev: boolean; analytics: boolean }): string {
  const directives: Array<[string, string[]]> = [
    ["default-src", ["'self'"]],
    ["script-src", ["'self'", "'unsafe-inline'", ...(dev ? ["'unsafe-eval'"] : []), ...(analytics ? GA_SCRIPT_HOSTS : [])]],
    ["style-src", ["'self'", "'unsafe-inline'"]],
    ["img-src", ["'self'", "data:", "blob:", ...(analytics ? GA_IMG_HOSTS : [])]],
    ["font-src", ["'self'", "data:"]],
    ["connect-src", ["'self'", ...(dev ? ["ws:"] : []), ...(analytics ? GA_CONNECT_HOSTS : [])]],
    ["worker-src", ["'self'", "blob:"]],
    ["media-src", ["'self'", "blob:"]],
    ["object-src", ["'none'"]],
    ["base-uri", ["'none'"]],
    ["form-action", ["'self'"]],
    ["frame-ancestors", ["'none'"]],
  ];
  const policy = directives.map(([name, values]) => `${name} ${values.join(" ")}`);
  // Plain-http localhost would have its own subresources upgraded to https, so production only.
  if (!dev) policy.push("upgrade-insecure-requests");
  return policy.join("; ");
}

export function securityHeaders(options: { dev: boolean; analytics: boolean }): Array<{ key: string; value: string }> {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy(options) },
    { key: "X-DNS-Prefetch-Control", value: "on" },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  ];
}

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
        headers: securityHeaders({
          dev: process.env.NODE_ENV !== "production",
          analytics: Boolean(process.env.NEXT_PUBLIC_GA_ID),
        }),
      },
    ];
  },
};

export default nextConfig;
