import type { Metadata } from "next";
import ToolGuide, { GuideLink } from "../../components/tool-guide";
import { pageMetadata } from "../../lib/seo";
import type { FaqItem } from "../tools/_components/tool-content";
import NotepadClient from "./notepad-client";

const DESCRIPTION =
  "A private Markdown notepad, encrypted in your browser with your password. Keep it on this device or sync the ciphertext. No email needed.";

export const metadata: Metadata = pageMetadata({
  title: "Encrypted, Password-Protected Notepad",
  description: DESCRIPTION,
  path: "/notepad",
  keywords: [
    "encrypted online notepad",
    "private notepad",
    "password protected notes",
    "secure online notepad",
    "encrypted notes",
    "protectedtext alternative",
  ],
});

const FAQ: FaqItem[] = [
  {
    question: "Is this notepad really private?",
    answer:
      "Your notes are encrypted in your browser with your password before they're saved anywhere. In local mode nothing is sent to us at all. With cloud sync, our server stores ciphertext it has no way to decrypt.",
  },
  {
    question: "What happens if I forget my password?",
    answer:
      "The notes stay locked. There's no reset, because we never have your password or a way around it. Keep it in a password manager or somewhere safe offline.",
  },
  {
    question: "Do I need an email to sign up?",
    answer:
      "No. A notepad needs only a username and a password, and a synced notepad's username is stored as a hash. The scratchpad needs neither.",
  },
  {
    question: "Can I open my notes on another device?",
    answer:
      "Yes, with cloud sync: sign in with the same username and password on the other device. A notepad kept in this browser exists only here, but you can sync it to the cloud later.",
  },
  {
    question: "Does it work offline?",
    answer:
      "A notepad kept in this browser works without a connection once the page has loaded. You can also download a note as a self-decrypting HTML file that opens offline with its password.",
  },
  {
    question: "Can ProtectedShare read synced notes?",
    answer:
      "No. Sync uploads the encrypted notepad, never your notes or password. The server checks a password proof to decide who may load or overwrite the ciphertext, but that proof can't decrypt it.",
  },
  {
    question: "Can I share a note from the notepad?",
    answer:
      "Yes. Sharing a note online creates a separate encrypted link that expires after 7 days, with a random password shown next to it. Send the link and the password by different routes. The note in your notepad stays as it is.",
  },
  {
    question: "Is the notepad open source?",
    answer:
      "Yes. ProtectedShare is open source under the MIT license, so you can read how the encryption works or run your own copy of the app and its API.",
  },
];

export default function NotepadPage() {
  return (
    <>
      <NotepadClient />
      {/* The open workspace is a full-width app; the guide is for the sign-in screen only. */}
      <ToolGuide
        className="[.notepad-full-width_&]:hidden"
        appName="ProtectedShare Encrypted Notepad"
        path="/notepad"
        description="A private Markdown notepad encrypted in your browser with your password, kept on your device or synced as ciphertext."
        features={[
          "AES-256-GCM encryption with a key derived from your password",
          "Local mode that keeps the notepad in this browser",
          "Optional cloud sync of the ciphertext",
          "Markdown editor with preview and split view",
          "Self-decrypting HTML export that opens offline",
          "Scratchpad that needs no username",
          "No email address required",
        ]}
        breadcrumb="Encrypted notepad"
        how={{
          title: "How the encrypted notepad works",
          steps: [
            {
              title: "Choose where it lives",
              body: "Keep the notepad in this browser, or sync it to open on other devices. Or start a scratchpad with no username at all.",
            },
            {
              title: "Lock it with a password",
              body: "Your password encrypts the notes with AES-256-GCM in the browser. It's never sent, and nobody can reset it.",
            },
            {
              title: "Write in Markdown",
              body: "Edit, preview or split the view. Every save encrypts the notes again; a synced notepad uploads only the ciphertext.",
            },
          ],
        }}
        uses={{
          title: "A private place to write",
          items: [
            {
              title: "Journals and drafts",
              body: "Write things you wouldn't put in a cloud document that its provider can read.",
            },
            {
              title: "Recovery codes and setup notes",
              body: "Keep backup codes, server notes and Wi‑Fi details encrypted, on one device or synced.",
            },
            {
              title: "Notes on several devices",
              body: "Sync the ciphertext and open the same notepad on your laptop and your phone.",
            },
            {
              title: "A file that unlocks offline",
              body: "Export a note as a self-decrypting HTML file for an archive or a USB stick. It opens with the password, no internet needed.",
            },
          ],
        }}
        limits={{
          title: "What's stored, and where",
          items: [
            {
              label: "Encryption",
              value: "AES-256-GCM with a key derived from your password by PBKDF2-SHA256, all in the browser.",
            },
            { label: "This browser", value: "The encrypted notepad is saved in this browser's storage and nothing is sent to us." },
            {
              label: "Scratchpad",
              value: "Encrypted with a random key saved beside it in this browser. That keeps it from our server, not from someone using this browser.",
            },
            {
              label: "Cloud sync",
              value: "Our server keeps the encrypted notepad, an encrypted check value, a SHA-256 hash of your username, a password proof and the time of the last save.",
            },
            { label: "Never sent", value: "Your notes, your password and your username in readable form." },
            {
              label: "Retention",
              value: "A synced notepad stays until you delete it. It doesn't expire on its own.",
            },
            {
              label: "Two devices",
              value: "If two devices save at the same moment, the notepad merges the changes in your browser instead of overwriting one.",
            },
          ],
          footnote: (
            <>
              Want to send one note to someone else? A <GuideLink href="/notes">secure note</GuideLink> gives them a link that
              burns after reading.
            </>
          ),
        }}
        faq={{ title: "Encrypted notepad questions", items: FAQ }}
        related={[
          { href: "/notes", title: "Secure note", body: "Share one note as a link that burns after reading." },
          { href: "/chat", title: "Encrypted chat", body: "Talk in a room encrypted in each browser." },
          { href: "/tools/encrypt-text", title: "Encrypt text", body: "Lock a block of text with a password, offline." },
          { href: "/tools/password-generator", title: "Password generator", body: "Make a passphrase for your notepad." },
          { href: "/vs/protectedtext", title: "ProtectedShare vs ProtectedText", body: "Two encrypted notepads, compared." },
          { href: "/blog/best-free-encrypted-notepad-online", title: "Choosing an encrypted notepad", body: "What to look for before you trust one." },
        ]}
      />
    </>
  );
}
