import type { Metadata } from "next";
import NotepadClient from "./notepad-client";

export const metadata: Metadata = {
  title: "Free Encrypted Online Notepad (Offline-First)",
  description: "An encrypted markdown notepad. Local mode stays in the browser. Cloud mode uploads ciphertext only. No account required.",
  alternates: {
    canonical: "https://protectedshare.me/notepad",
  },
  openGraph: {
    title: "Free Encrypted Online Notepad (Offline-First) — ProtectedShare",
    description: "An encrypted markdown notepad. Local mode stays in the browser. Cloud mode uploads ciphertext only. No account required.",
    url: "https://protectedshare.me/notepad",
  },
  twitter: {
    title: "Free Encrypted Online Notepad (Offline-First) — ProtectedShare",
    description: "An encrypted markdown notepad. Local mode stays in the browser. Cloud mode uploads ciphertext only. No account required.",
  },
};

export default function NotepadPage() {
  return <NotepadClient />;
}
