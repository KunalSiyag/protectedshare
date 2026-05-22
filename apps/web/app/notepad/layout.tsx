import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Encrypted Notepad — ProtectedShare",
  description:
    "A free, offline-first encrypted notepad that stores your notes securely in your browser with AES-256 encryption. No cloud, no server, no signup. Your data stays on your device.",
  alternates: {
    canonical: "https://protectedshare.me/notepad",
  },
  openGraph: {
    title: "Encrypted Notepad — ProtectedShare",
    description:
      "Free encrypted notepad. Notes are AES-256 encrypted and stored locally in your browser. Zero server contact.",
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
