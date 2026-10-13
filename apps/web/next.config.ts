import type { NextConfig } from "next";
import { BLOG_REDIRECTS } from "./lib/blog-redirects";

// Google Analytics hosts, allowed only when NEXT_PUBLIC_GA_ID is set at build time.
const GA_SCRIPT_HOSTS = ["https://www.googletagmanager.com"];
const GA_IMG_HOSTS = ["https://*.google-analytics.com", "https://*.googletagmanager.com"];
const GA_CONNECT_HOSTS = [
  "https://*.google-analytics.com",
  "https://*.analytics.google.com",
  "https://*.googletagmanager.com",
];

// Cloudflare Web Analytics hosts, allowed only when NEXT_PUBLIC_CF_BEACON_TOKEN is set at build time.
const CF_BEACON_SCRIPT_HOSTS = ["https://static.cloudflareinsights.com"];
const CF_BEACON_CONNECT_HOSTS = ["https://cloudflareinsights.com"];

// Called from the browser by /tools/breached-password-checker only.
const PWNED_PASSWORDS_API = "https://api.pwnedpasswords.com";

/**
 * Pages that open or hold shared content, the same set components/analytics.tsx never loads
 * analytics on. Their Content-Security-Policy leaves the analytics hosts out. `:id+` needs a
 * segment, so the composers (/notes, /secrets, /files, /request) keep the full policy; `:path*`
 * also matches the bare path.
 */
const SENSITIVE_PATHS = [
  "/notes/:id+",
  "/secrets/:id+",
  "/files/:id+",
  "/request/:path+",
  "/chat/:path*",
  "/links/:path*",
  "/notepad/:path*",
  "/share-target/:path*",
];

type PolicyOptions = {
  dev: boolean;
  /** Google Analytics (NEXT_PUBLIC_GA_ID). */
  analytics: boolean;
  /** Cloudflare Web Analytics (NEXT_PUBLIC_CF_BEACON_TOKEN). */
  cloudflareAnalytics?: boolean;
  /** Extra connect-src origins for a single route. */
  connect?: string[];
};

/**
 * Content-Security-Policy for every route.
 *
 * 'unsafe-inline' stays in script-src because the App Router streams inline RSC bootstrap
 * scripts without nonces (and the theme script runs inline before paint). What this policy does
 * buy: scripts load only from this origin (plus the analytics hosts that are switched on), and
 * connect-src/img-src/form-action keep injected markup or script from sending data to other hosts.
 * Development adds 'unsafe-eval' (React dev tooling) and ws: (hot reload).
 */
export function contentSecurityPolicy({ dev, analytics, cloudflareAnalytics = false, connect = [] }: PolicyOptions): string {
  const directives: Array<[string, string[]]> = [
    ["default-src", ["'self'"]],
    [
      "script-src",
      [
        "'self'",
        "'unsafe-inline'",
        ...(dev ? ["'unsafe-eval'"] : []),
        ...(analytics ? GA_SCRIPT_HOSTS : []),
        ...(cloudflareAnalytics ? CF_BEACON_SCRIPT_HOSTS : []),
      ],
    ],
    ["style-src", ["'self'", "'unsafe-inline'"]],
    ["img-src", ["'self'", "data:", "blob:", ...(analytics ? GA_IMG_HOSTS : [])]],
    ["font-src", ["'self'", "data:"]],
    [
      "connect-src",
      [
        "'self'",
        ...(dev ? ["ws:"] : []),
        ...(analytics ? GA_CONNECT_HOSTS : []),
        ...(cloudflareAnalytics ? CF_BEACON_CONNECT_HOSTS : []),
        ...connect,
      ],
    ],
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

export function securityHeaders(options: PolicyOptions): Array<{ key: string; value: string }> {
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
  // Lets a production build run beside `next dev` (e.g. NEXT_DIST_DIR=.next-build next build).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  transpilePackages: [
    "@protectedshare/contracts",
    "@protectedshare/crypto",
    "@protectedshare/ui",
    "@protectedshare/formatting"
  ],
  async redirects() {
    return [
      // Retired blog posts: redirect before the route renders (redirecting inside the page duplicated
      // the Location header on cache misses).
      ...Object.entries(BLOG_REDIRECTS).map(([slug, destination]) => ({
        source: `/blog/${slug}`,
        destination,
        permanent: true,
      })),
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
    const policy: PolicyOptions = {
      dev: process.env.NODE_ENV !== "production",
      analytics: Boolean(process.env.NEXT_PUBLIC_GA_ID),
      cloudflareAnalytics: Boolean(process.env.NEXT_PUBLIC_CF_BEACON_TOKEN),
    };
    return [
      {
        source: "/(.*)",
        headers: securityHeaders(policy),
      },
      // The breached-password checker queries the Pwned Passwords range API from the browser. When
      // two rules set the same header, Next sends the later one, so this must stay after the rule
      // above. A CSP is fixed when the document loads: reaching this page by client-side navigation
      // keeps the policy of the page the visitor started on.
      {
        source: "/tools/breached-password-checker",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy({ ...policy, connect: [PWNED_PASSWORDS_API] }),
          },
        ],
      },
      // Share pages never load analytics, so their policy doesn't allow its hosts either. Also after
      // the global rule, for the same reason. Like any CSP, it applies to documents loaded on these
      // paths; a client-side navigation into one keeps the policy of the page it started from.
      ...SENSITIVE_PATHS.map((source) => ({
        source,
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy({ ...policy, analytics: false, cloudflareAnalytics: false }),
          },
        ],
      })),
    ];
  },
};

export default nextConfig;
