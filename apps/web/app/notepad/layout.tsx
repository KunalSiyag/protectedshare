import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Encrypted Notepad — Secure Cloud Sync, No Signup",
  description:
    "A free, zero-knowledge encrypted online notepad. Notes are AES-256 encrypted client-side and synced securely across your devices — no registration, no tracking. Your decryption keys never leave your device.",
  alternates: {
    canonical: "https://protectedshare.me/notepad",
  },
  keywords: [
    "free encrypted notepad",
    "online notepad encrypted",
    "cross device notepad",
    "no signup notepad",
    "private notes app",
    "protectedtext notepad alternative",
  ],
  openGraph: {
    title: "Free Encrypted Notepad — Secure Cloud Sync",
    description:
      "Free encrypted notepad with zero-knowledge cloud sync. Notes are AES-256 encrypted client-side and synced across devices.",
    url: "https://protectedshare.me/notepad",
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
    title: "Free Encrypted Notepad — Secure Cloud Sync",
    description:
      "Free encrypted notepad with zero-knowledge cloud sync. Notes are AES-256 encrypted client-side and synced across devices.",
    images: ["/og-image.png"],
  },
};

export default function NotepadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
