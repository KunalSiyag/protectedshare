import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Anonymous Chat Room — No Signup, End-to-End Encrypted",
  description:
    "Start an anonymous online chat room instantly. No signup, no phone number, no email. Messages are end-to-end encrypted in your browser with AES-256-GCM.",
  keywords: [
    "anonymous chat room",
    "anonymous chat no signup",
    "private chat room online",
    "encrypted chat room free",
    "temporary chat room",
    "chat without phone number",
    "no registration chat",
  ],
  alternates: {
    canonical: "https://protectedshare.me/anonymous-chat-room",
  },
  openGraph: {
    title: "Anonymous Chat Room — No Signup, End-to-End Encrypted — ProtectedShare",
    description:
      "Start an anonymous online chat instantly. No signup, no phone number. Messages are end-to-end encrypted in your browser.",
    url: "https://protectedshare.me/anonymous-chat-room",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anonymous Chat Room — No Signup, End-to-End Encrypted — ProtectedShare",
    description:
      "Start an anonymous online chat instantly. No signup, no phone number. Messages are end-to-end encrypted in your browser.",
  },
};

export default function AnonymousChatRoomPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
      <div className="max-w-3xl">
        <p className="text-xs font-mono uppercase tracking-[0.24em] text-blue-600 dark:text-emerald-400 mb-4">
          Private Conversations
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
          An anonymous chat room with nothing to sign up for.
        </h1>
        <p className="mt-5 text-base md:text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          No account, no phone number, no email address. Open a room, share the address with the people who need it, and
          talk. Every message is encrypted in your browser before it is ever sent.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/chat" className="rounded-md bg-blue-600 dark:bg-white px-5 py-2.5 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-blue-700 dark:hover:bg-zinc-100 transition-colors">
            Open a Chat Room
          </Link>
          <Link href="/notes" className="rounded-md border border-zinc-300 dark:border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors">
            Need to send a secret instead?
          </Link>
        </div>
      </div>

      <section className="mt-12 grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-6">
          <h2 className="text-base font-bold text-zinc-950 dark:text-white">Truly anonymous</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            There is no profile to create and no identity to hand over. Nothing ties a conversation to a name, number,
            or inbox.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-6">
          <h2 className="text-base font-bold text-zinc-950 dark:text-white">Encrypted in the browser</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            Messages are locked with AES-256-GCM before they leave your device. The server relays encrypted blobs it
            cannot read.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-6">
          <h2 className="text-base font-bold text-zinc-950 dark:text-white">Keys stay local</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            The room key lives in the URL hash fragment, which browsers never send to servers. Whoever holds the link
            holds the only way in.
          </p>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-6 md:p-8">
        <h2 className="text-xl font-bold text-zinc-950 dark:text-white">Good moments for an anonymous room</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
          <li>Coordinating with teammates during an incident without cluttering permanent chat history.</li>
          <li>A private conversation with someone you have not exchanged contacts with yet.</li>
          <li>Cross-team or cross-company discussions that should not live in either company&apos;s tools.</li>
          <li>Quick questions that deserve privacy but not another app install.</li>
        </ul>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "Do I need an account to use the anonymous chat room?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No. There is no signup, no email, and no phone number required. You open a room URL and start talking immediately.",
                },
              },
              {
                "@type": "Question",
                name: "Can the server read my messages?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No. Messages are encrypted client-side with AES-256-GCM before they are sent. The server only relays encrypted blobs, and the decryption key stays in the browser via the URL hash fragment.",
                },
              },
              {
                "@type": "Question",
                name: "How do I invite someone to my chat room?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Copy the room link and share it through any channel. Anyone with the link can join, since the link itself contains the room address and key material that never reaches the server.",
                },
              },
            ],
          }),
        }}
      />
    </main>
  );
}
