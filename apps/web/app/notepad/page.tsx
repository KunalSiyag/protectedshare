import type { Metadata } from "next";
import NotepadClient from "./notepad-client";

export const metadata: Metadata = {
  title: "Free Encrypted Online Notepad (Offline-First)",
  description: "An offline-first encrypted online notepad. Take secure notes, draft markdown documents, and keep your text client-side encrypted in browser storage. No data is sent to the server.",
  alternates: {
    canonical: "https://protectedshare.me/notepad",
  },
  openGraph: {
    title: "Free Encrypted Online Notepad (Offline-First) — ProtectedShare",
    description: "An offline-first encrypted online notepad. Take secure notes, draft markdown documents, and keep your text client-side encrypted in browser storage.",
    url: "https://protectedshare.me/notepad",
  },
  twitter: {
    title: "Free Encrypted Online Notepad (Offline-First) — ProtectedShare",
    description: "An offline-first encrypted online notepad. Take secure notes, draft markdown documents, and keep your text client-side encrypted in browser storage.",
  },
};

export default function NotepadPage() {
  return <NotepadClient />;
}
