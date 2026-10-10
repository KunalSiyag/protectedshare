import type { Metadata } from "next";
import ChatClient from "./chat-client";

export const metadata: Metadata = {
  title: "Anonymous Encrypted Chatroom (Zero-Knowledge)",
  description: "Start an end-to-end encrypted chat room in your browser. Messages, photos and files are sealed with AES-256-GCM before they leave; the server relays ciphertext. No signup.",
  keywords: [
    "anonymous encrypted chatroom",
    "encrypted chatroom",
    "secure text sharing link",
    "secret share",
    "zero knowledge chat",
    "private encrypted chat",
    "chatroom alternative",
  ],
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
