import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Encrypted Notepad — Offline, No Signup, No Cloud",
  description:
    "A free, offline-first encrypted notepad. Notes are AES-256 encrypted and stored locally in your browser — no cloud, no server, no signup. Your data never leaves your device.",
  alternates: {
    canonical: "https://protectedshare.me/notepad",
  },
  keywords: [
    "free encrypted notepad",
    "online notepad encrypted",
    "offline notepad",
    "no signup notepad",
    "private notes app",
    "protectedtext notepad alternative",
  ],
  openGraph: {
    title: "Free Encrypted Notepad — Offline, No Signup",
    description:
      "Free encrypted notepad. AES-256 encrypted notes stored locally in your browser. Zero server contact.",
    url: "https://protectedshare.me/notepad",
  },
};

export default function NotepadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
