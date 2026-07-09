import type { Metadata } from "next";
import ChatClient from "./chat-client";

export const metadata: Metadata = {
  title: "Anonymous Encrypted Chatroom (Zero-Knowledge)",
  description: "Join an end-to-end encrypted, zero-knowledge, anonymous chatroom. Messages are encrypted client-side using AES-256-GCM. No signup required.",
  alternates: {
    canonical: "https://protectedshare.me/chat",
  },
  openGraph: {
    title: "Anonymous Encrypted Chatroom (Zero-Knowledge) — ProtectedShare",
    description: "Join an end-to-end encrypted, zero-knowledge, anonymous chatroom. Messages are encrypted client-side using AES-256-GCM.",
    url: "https://protectedshare.me/chat",
  },
  twitter: {
    title: "Anonymous Encrypted Chatroom (Zero-Knowledge) — ProtectedShare",
    description: "Join an end-to-end encrypted, zero-knowledge, anonymous chatroom. Messages are encrypted client-side using AES-256-GCM.",
  },
};

export default function ChatPage() {
  return <ChatClient />;
}
