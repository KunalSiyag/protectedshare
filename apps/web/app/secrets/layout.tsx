import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EnvShare — Share .env Files & API Keys Securely",
  description:
    "Share API keys, database URLs, and entire .env files securely with AES-256 zero-knowledge encryption. Self-destructing links that burn after the first read. Free alternative to EnvShare.",
  alternates: {
    canonical: "https://protectedshare.me/secrets",
  },
  keywords: [
    "envshare",
    "share env file",
    "share api key securely",
    "secure dotenv sharing",
    "one-time secret link",
    "burn after read",
    "share database credentials",
    "encrypted secret link",
  ],
  openGraph: {
    title: "EnvShare — Share .env Files & API Keys Securely",
    description:
      "AES-256 encrypted, self-destructing .env file sharing. Zero-knowledge — the key never touches the server.",
    url: "https://protectedshare.me/secrets",
  },
};

export default function SecretsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
