import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Share One-Time Secret — ProtectedShare",
  description:
    "Securely share passwords, API keys, and credentials with self-destructing one-time links. AES-256 encrypted in your browser. The secret is permanently deleted after being viewed once.",
  alternates: {
    canonical: "https://protectedshare.me/secrets",
  },
  openGraph: {
    title: "Share One-Time Secret — ProtectedShare",
    description:
      "Self-destructing encrypted secret sharing. Send passwords and API keys that auto-delete after one view.",
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
