import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EnvShare — Share .env Files & API Keys Free, No Signup",
  description:
    "Share API keys, database URLs, and .env files securely with AES-256 encryption. Self-destructing links with configurable read limits (1-10 reads). Free EnvShare and Privnote alternative — no signup required.",
  alternates: {
    canonical: "https://protectedshare.me/secrets",
  },
  keywords: [
    "envshare",
    "envshare alternative",
    "share env file free",
    "share api key securely",
    "secure dotenv sharing",
    "one-time secret link",
    "burn after read",
    "share database credentials",
    "encrypted secret link",
    "privnote alternative",
    "no signup secret sharing",
  ],
  openGraph: {
    title: "EnvShare — Share .env Files & API Keys Free, No Signup",
    description:
      "AES-256 encrypted .env file sharing with configurable read limits. Zero-knowledge — the key never touches the server. Free forever.",
    url: "https://protectedshare.me/secrets",
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
    title: "EnvShare — Share .env Files & API Keys Free, No Signup",
    description:
      "AES-256 encrypted .env file sharing with configurable read limits. Zero-knowledge — the key never touches the server. Free forever.",
    images: ["/og-image.png"],
  },
};

export default function SecretsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
