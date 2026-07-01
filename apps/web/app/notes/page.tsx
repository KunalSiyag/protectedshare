import type { Metadata } from "next";
import NotesClient from "./notes-client";

export const metadata: Metadata = {
  title: "Secure Notes Sharing Online (Zero-Knowledge)",
  description: "Share end-to-end encrypted secure notes, passwords, and sensitive messages. AES-256-GCM encryption client-side. No signup, no storage of passwords.",
  alternates: {
    canonical: "https://protectedshare.me/notes",
  },
  openGraph: {
    title: "Secure Notes Sharing Online (Zero-Knowledge) — ProtectedShare",
    description: "Share end-to-end encrypted secure notes, passwords, and sensitive messages. AES-256-GCM encryption client-side. No signup.",
    url: "https://protectedshare.me/notes",
  },
  twitter: {
    title: "Secure Notes Sharing Online (Zero-Knowledge) — ProtectedShare",
    description: "Share end-to-end encrypted secure notes, passwords, and sensitive messages. AES-256-GCM encryption client-side. No signup.",
  },
};

export default function NotesPage() {
  return <NotesClient />;
}
