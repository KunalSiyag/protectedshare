import type { Metadata } from "next";
import SecretsClient from "./secrets-client";

export const metadata: Metadata = {
  title: "EnvShare — Share .env Files & API Keys Securely",
  description: "Share your environment variables (.env files) and API keys securely with developer-friendly client-side AES-256-GCM encryption. Set read limits and auto-destruction.",
  alternates: {
    canonical: "https://protectedshare.me/secrets",
  },
  openGraph: {
    title: "EnvShare — Share .env Files & API Keys Securely — ProtectedShare",
    description: "Share your environment variables (.env files) and API keys securely with developer-friendly client-side AES-256-GCM encryption.",
    url: "https://protectedshare.me/secrets",
  },
  twitter: {
    title: "EnvShare — Share .env Files & API Keys Securely — ProtectedShare",
    description: "Share your environment variables (.env files) and API keys securely with developer-friendly client-side AES-256-GCM encryption.",
  },
};

export default function SecretsPage() {
  return <SecretsClient />;
}
