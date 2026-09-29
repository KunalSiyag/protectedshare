import type { Metadata } from "next";
import NotesClient from "./notes-client";

export const metadata: Metadata = {
  title: "Secure Notes Sharing Online",
  description: "Encrypt a note in your browser. The link can open it, or you can keep the password separate. Expiry up to 30 days, with optional burn after reading.",
  alternates: {
    canonical: "https://protectedshare.me/notes",
  },
  openGraph: {
    title: "Secure Notes Sharing Online — ProtectedShare",
    description: "Encrypt a note in your browser. The link can open it, or you can keep the password separate. Expiry up to 30 days, with optional burn after reading.",
    url: "https://protectedshare.me/notes",
  },
  twitter: {
    title: "Secure Notes Sharing Online — ProtectedShare",
    description: "Encrypt a note in your browser. The link can open it, or you can keep the password separate. Expiry up to 30 days, with optional burn after reading.",
  },
};

export default function NotesPage() {
  return <NotesClient />;
}
