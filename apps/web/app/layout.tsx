import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppShell from "./app-shell";
import Analytics from "../components/analytics";
import JsonLd from "../components/json-ld";
import { DEFAULT_DESCRIPTION, organizationJsonLd, websiteJsonLd } from "../lib/seo";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F7F7" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0D0D" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "Zero-Knowledge Secure Note Sharing | ProtectedShare",
    template: "%s | ProtectedShare",
  },
  description: DEFAULT_DESCRIPTION,
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
    description: DEFAULT_DESCRIPTION,
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
    description: DEFAULT_DESCRIPTION,
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
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=null;try{t=window.localStorage.getItem("theme")}catch(e){}var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-bg font-sans text-ui text-ink-2 antialiased flex flex-col">
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <AppShell>{children}</AppShell>
        <Analytics />
      </body>
    </html>
  );
}
