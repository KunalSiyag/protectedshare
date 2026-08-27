import type { Metadata } from "next";
import AppShell from "./app-shell";
import JsonLd from "../components/json-ld";
import { organizationJsonLd, websiteJsonLd } from "../lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Zero-Knowledge Secure Note Sharing | ProtectedShare",
    template: "%s | ProtectedShare",
  },
  description: "AES-256 encrypted notes, .env sharing (EnvShare), and self-destructing secret links. Zero-knowledge, no signup, no tracking.",
  keywords: [
    "zero-knowledge",
    "secure note sharing",
    "encrypted notepad",
    "envshare",
    "self-destructing link",
    "protectedtext alternative",
  ],
  authors: [{ name: "ProtectedShare Team" }],
  creator: "ProtectedShare",
  metadataBase: new URL("https://protectedshare.me"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://protectedshare.me",
    title: "Zero-Knowledge Secure Note Sharing | ProtectedShare",
    description: "AES-256 encrypted notes, .env sharing, and burn-after-read secrets. Free forever, no accounts, no tracking.",
    siteName: "ProtectedShare",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ProtectedShare - Zero-Knowledge Secure Notes & Online Notepad",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zero-Knowledge Secure Note Sharing | ProtectedShare",
    description: "AES-256 encrypted notes, .env sharing, and burn-after-read secrets. Free forever, no accounts.",
    creator: "@ProtectedShare",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your Google Search Console verification code here after setup
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=window.localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);})();`,
          }}
        />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
      </head>
      <body className="antialiased min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-300 font-sans selection:bg-blue-200 dark:selection:bg-zinc-800 selection:text-zinc-900 dark:selection:text-white flex flex-col">
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
