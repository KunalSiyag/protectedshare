import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Encrypted Notes — Share Passwords Securely, No Signup",
  description:
    "Create and share encrypted notes with AES-256 zero-knowledge encryption. Set expiration, enable burn-after-read, and share the link and password through separate channels. Free ProtectedText alternative — no signup required.",
  alternates: {
    canonical: "https://protectedshare.me/notes",
  },
  keywords: [
    "free encrypted notes",
    "share password securely",
    "protectedtext alternative",
    "secure note sharing",
    "encrypted text sharing",
    "burn after read notes",
    "no signup secure notes",
  ],
  openGraph: {
    title: "Free Encrypted Notes — No Signup Required",
    description:
      "Zero-knowledge encrypted note sharing. AES-256-GCM client-side encryption. Free ProtectedText alternative.",
    url: "https://protectedshare.me/notes",
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
    title: "Free Encrypted Notes — No Signup Required",
    description:
      "Zero-knowledge encrypted note sharing. AES-256-GCM client-side encryption. Free ProtectedText alternative.",
    images: ["/og-image.png"],
  },
};

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
