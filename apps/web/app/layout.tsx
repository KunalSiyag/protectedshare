import type { Metadata } from "next";
import AppShell from "./app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ProtectedShare — Zero-Knowledge Encrypted Notes & One-Time Secrets",
    template: "%s | ProtectedShare",
  },
  description: "Share passwords, API keys, and sensitive documents securely. Features client-side AES-256-GCM encryption, self-destructing links, and a built-in offline-first encrypted notepad.",
  keywords: [
    "zero-knowledge",
    "secure note sharing",
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
    "encrypted note",
    "secure link generator",
    "AES-256 encryption tool",
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
    title: "ProtectedShare — Zero-Knowledge Secure Notes & Secrets",
    description: "AES-256 encrypted, self-destructing temporary sharing utility. Plaintext never touches our servers.",
    siteName: "ProtectedShare",
  },
  twitter: {
    card: "summary_large_image",
    title: "ProtectedShare — Zero-Knowledge Secure Notes & Secrets",
    description: "AES-256 encrypted, self-destructing temporary sharing utility. Plaintext never touches servers.",
    creator: "@ProtectedShare",
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
    // google: "your-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=window.localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);})();`,
          }}
        />
      </head>
      <body className="antialiased min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-300 font-sans selection:bg-blue-200 dark:selection:bg-zinc-800 selection:text-zinc-900 dark:selection:text-white flex flex-col transition-colors duration-300">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
