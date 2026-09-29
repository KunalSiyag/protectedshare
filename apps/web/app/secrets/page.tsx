import type { Metadata } from "next";
import SecretsClient from "./secrets-client";

export const metadata: Metadata = {
  title: "EnvShare — Share .env Files & API Keys Securely",
  description: "Share a .env file or API key. The password stays in the link hash. Choose 1 to 100 reads and an expiry up to 30 days. Encrypted in the browser with AES-256-GCM.",
  alternates: {
    canonical: "https://protectedshare.me/secrets",
  },
  openGraph: {
    title: "EnvShare — Share .env Files & API Keys Securely — ProtectedShare",
    description: "Share a .env file or API key. The password stays in the link hash. Choose 1 to 100 reads and an expiry up to 30 days. Encrypted in the browser with AES-256-GCM.",
    url: "https://protectedshare.me/secrets",
  },
  twitter: {
    title: "EnvShare — Share .env Files & API Keys Securely — ProtectedShare",
    description: "Share a .env file or API key. The password stays in the link hash. Choose 1 to 100 reads and an expiry up to 30 days. Encrypted in the browser with AES-256-GCM.",
  },
};

export default function SecretsPage() {
  return <SecretsClient />;
}
