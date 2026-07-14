import type { Metadata } from "next";
import AppShell from "./app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ProtectedText Alternative | Free Online Notepad & EnvShare — No Signup",
    template: "%s | ProtectedShare",
  },
  description: "The modern ProtectedText alternative. Free encrypted online notepad, .env file sharing (EnvShare), and self-destructing secret links — all with AES-256 zero-knowledge encryption. No signup, no tracking, no compromise.",
  keywords: [
    "free secure notes",
    "envshare",
    "no signup",
    "protectedtext alternative",
    "protected text",
    "protected text alternative",
    "protectedtext alternative",
    "online notepad",
    "free notepad online",
    "share env file",
    "encrypted notes free",
    "zero-knowledge",
    "secure note sharing",
    "secret share",
    "secure text sharing link",
    "self destruct link",
    "self-destructing link",
    "one-time secret",
    "burn after read",
    "password sharing tool",
    "encrypted notepad",
    "self-destructing message",
    "client-side encryption",
    "private text sharing",
    "share password securely",
    "send API key safely",
    "temporary secret link",
    "secure link generator",
    "AES-256 encryption tool",
    "share api key",
    "free online notepad encrypted",
    "privnote alternative",
    "privnote alternatives",
    "anonymous chatroom",
    "encrypted chat",
    "zero knowledge chat",
    "encrypted chatroom",
    "anonymous encrypted chatroom",
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
    title: "Free Secure Notes & EnvShare — No Signup Required",
    description: "AES-256 encrypted notes, .env sharing, and burn-after-read secrets. Free forever, no accounts, no tracking.",
    siteName: "ProtectedShare",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ProtectedShare - Zero-Knowledge Secure Notes & Online Notepad",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Secure Notes & EnvShare — No Signup Required",
    description: "AES-256 encrypted notes, .env sharing, and burn-after-read secrets. Free forever, no accounts.",
    creator: "@ProtectedShare",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
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
        <link rel="icon" href="/logo.svg" type="image/svg+xml" sizes="any" />
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
      <body className="antialiased min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-300 font-sans selection:bg-blue-200 dark:selection:bg-zinc-800 selection:text-zinc-900 dark:selection:text-white flex flex-col transition-colors duration-300">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
