import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Encrypted Note — ProtectedShare",
  description:
    "Create and share encrypted notes with AES-256 zero-knowledge encryption. Set expiration, enable burn-after-read, and share the link and password through separate channels for maximum security.",
  alternates: {
    canonical: "https://protectedshare.me/notes",
  },
  openGraph: {
    title: "Create Encrypted Note — ProtectedShare",
    description:
      "Zero-knowledge encrypted note sharing. AES-256-GCM client-side encryption with PBKDF2 key derivation.",
    url: "https://protectedshare.me/notes",
  },
};

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
