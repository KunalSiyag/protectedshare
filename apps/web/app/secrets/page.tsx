import type { Metadata } from "next";
import SecretsClient from "./secrets-client";

export const metadata: Metadata = {
  title: "EnvShare — Share .env Files & API Keys Securely",
  description: "Share a .env file or API key. Encrypted in your browser with AES-256-GCM; the key stays in the link after the #. Deleted after 1 to 100 reads or up to 30 days.",
  alternates: {
    canonical: "https://protectedshare.me/secrets",
  },
  openGraph: {
    title: "EnvShare — Share .env Files & API Keys Securely — ProtectedShare",
    description: "Share a .env file or API key. Encrypted in your browser with AES-256-GCM; the key stays in the link after the #. Deleted after 1 to 100 reads or up to 30 days.",
    url: "https://protectedshare.me/secrets",
  },
  twitter: {
    title: "EnvShare — Share .env Files & API Keys Securely — ProtectedShare",
    description: "Share a .env file or API key. Encrypted in your browser with AES-256-GCM; the key stays in the link after the #. Deleted after 1 to 100 reads or up to 30 days.",
  },
};

export default function SecretsPage() {
  return <SecretsClient />;
}
