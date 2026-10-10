import type { Metadata } from "next";
import NotesClient from "./notes-client";

export const metadata: Metadata = {
  title: "Secure Notes Sharing Online",
  description: "Encrypt a note in your browser and share a link. The link can open it, or add a password sent another way. Burns after one read by default; expires within 30 days.",
  alternates: {
    canonical: "https://protectedshare.me/notes",
  },
  openGraph: {
    title: "Secure Notes Sharing Online — ProtectedShare",
    description: "Encrypt a note in your browser and share a link. The link can open it, or add a password sent another way. Burns after one read by default; expires within 30 days.",
    url: "https://protectedshare.me/notes",
  },
  twitter: {
    title: "Secure Notes Sharing Online — ProtectedShare",
    description: "Encrypt a note in your browser and share a link. The link can open it, or add a password sent another way. Burns after one read by default; expires within 30 days.",
  },
};

export default function NotesPage() {
  return <NotesClient />;
}
