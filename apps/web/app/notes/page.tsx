import type { Metadata } from "next";
import ToolGuide, { GuideLink } from "../../components/tool-guide";
import { pageMetadata } from "../../lib/seo";
import type { FaqItem } from "../tools/_components/tool-content";
import NotesClient from "./notes-client";

const DESCRIPTION =
  "Write a note, encrypt it in your browser and send a one-time link. It burns after reading or expires within 30 days. Free, no signup.";

export const metadata: Metadata = pageMetadata({
  title: "Self-Destructing Notes: One-Time Secrets",
  description: DESCRIPTION,
  path: "/notes",
  keywords: [
    "self-destructing note",
    "self-destructing message",
    "one-time secret link",
    "burn after reading",
    "send password securely",
    "privnote alternative",
  ],
});

const FAQ: FaqItem[] = [
  {
    question: "How does a self-destructing note work?",
    answer:
      "Your browser encrypts the note before it's uploaded, so the server only stores ciphertext. When the recipient clicks Open, their browser fetches it and decrypts it. With burn after reading on, the server deletes the note in the same request that hands it over, so a second visit finds nothing.",
  },
  {
    question: "Can ProtectedShare read my note?",
    answer:
      "No. The server gets ciphertext and a hash it uses to check the reader's key. The key travels after the # in the link, which browsers don't send to servers, and a password never leaves your browser. Without one of them the stored note can't be decrypted. The code is open source, so you can check.",
  },
  {
    question: "Can the recipient screenshot or copy the note?",
    answer:
      "Yes. Nothing on a web page can stop a screenshot, a photo of the screen or copy and paste. Burn after reading limits how long the note exists on our server. It can't control what the reader does once it's on their screen, so only send it to someone you'd trust with it anyway.",
  },
  {
    question: "What if someone else opens the link first?",
    answer:
      "They get the note and the link stops working, so your recipient finds it gone. That tells you the link was intercepted: treat the secret as exposed and change it. Link previews in chat apps don't count, because a burning note only opens when someone clicks Open.",
  },
  {
    question: "Should I add a password?",
    answer:
      "The link alone is simplest: anyone holding the whole link can open the note. Add a password and send it another way, like a call, and a leaked link opens nothing. With password only, the link carries no key at all, so pick a long password. It's the only thing protecting the note.",
  },
  {
    question: "How long does a note last?",
    answer:
      "You choose 1 hour, 1 day, 7 days or a date up to 30 days out. A burning note is deleted when it's opened. An unopened note can't be read after it expires, and a cleanup job that runs every 30 minutes removes it.",
  },
  {
    question: "Can I tell whether my note was read?",
    answer:
      "Yes. My links, in the browser you used to create it, shows whether the note was opened and lets you delete it early. For that the server keeps a status and a few timestamps, never the note.",
  },
  {
    question: "Is it free? Do I need an account?",
    answer:
      "It's free, and there's no account or email on either side. ProtectedShare is open source under the MIT license, and you can host your own copy.",
  },
];

export default function NotesPage() {
  return (
    <>
      <NotesClient />
      <ToolGuide
        appName="ProtectedShare Secure Notes"
        path="/notes"
        description="Send a self-destructing note: it's encrypted in your browser, opened with a one-time link, and deleted after the first read or at expiry."
        features={[
          "AES-256-GCM encryption in the browser",
          "Key in the link fragment, a separate password, or both",
          "Burn after reading, on by default",
          "Expiry from 1 hour to 30 days",
          "Markdown formatting for the reader",
          "Read status and early delete from My links",
          "No account for sender or reader",
        ]}
        breadcrumb="Secure notes"
        how={{
          title: "How a self-destructing note works",
          steps: [
            {
              title: "Write it and seal it",
              body: "Type the note. Before anything is sent, your browser encrypts it with AES-256-GCM, using a random key, a password, or both.",
            },
            {
              title: "Send the link",
              body: "The key rides after the # in the link, a part browsers never send to servers. If you set a password, send it another way.",
            },
            {
              title: "Read once, then gone",
              body: "Their browser fetches the ciphertext and decrypts it. With burn after reading on, the server deletes the note as it hands it over.",
            },
          ],
        }}
        uses={{
          title: "For things you'd rather not leave in a chat",
          items: [
            {
              title: "Passwords and Wi‑Fi codes",
              body: "Give someone a login or the Wi‑Fi password without it sitting in their chat history for years.",
            },
            {
              title: "Recovery codes and PINs",
              body: "Codes that should be read once, saved in a password manager, and then exist nowhere else.",
            },
            {
              title: "Personal details",
              body: "Bank details, an address or an ID number: things you'd say on the phone but not put in an email.",
            },
            {
              title: "Two-channel handoffs",
              body: "Email the link and read out the password on a call. Someone who gets into one channel still can't open the note.",
            },
          ],
        }}
        limits={{
          title: "What the server keeps, and for how long",
          items: [
            {
              label: "Encryption",
              value: "AES-256-GCM in your browser, with a random 256-bit key in the link, a password stretched with PBKDF2-SHA256 (600,000 rounds), or both.",
            },
            {
              label: "Server keeps",
              value: "Ciphertext, IV, salt, the encryption mode, a hash it checks before releasing the ciphertext, the expiry time and the burn flag.",
            },
            { label: "Never sent", value: "The note, the key after the #, and the password." },
            {
              label: "Size",
              value: "Up to 50,000 characters. Markdown is shown formatted to the reader; images never load and raw HTML is dropped.",
            },
            { label: "Expiry", value: "1 hour, 1 day, 7 days, or a date you pick up to 30 days out." },
            {
              label: "Deletion",
              value: "On the first open when burn after reading is on, otherwise at expiry. Expired notes can't be opened, and a cleanup job removes them every 30 minutes.",
            },
            {
              label: "Receipt",
              value: "For My links, the server also keeps whether the note was opened and when. Never its content.",
            },
          ],
          footnote: (
            <>
              Every stored field for every tool is listed on the <GuideLink href="/privacy">privacy page</GuideLink>. The
              cryptography is explained in the <GuideLink href="/security">security model</GuideLink>.
            </>
          ),
        }}
        faq={{ title: "Self-destructing notes, answered", items: FAQ }}
        related={[
          { href: "/secrets", title: "EnvShare", body: "Share .env files and API keys with 1 to 100 reads." },
          { href: "/request", title: "Secret request", body: "Ask someone to send you a password, encrypted to you." },
          { href: "/files", title: "File drop", body: "Send encrypted files up to 25 MB." },
          { href: "/tools/password-generator", title: "Password generator", body: "Make a strong password before you send it." },
          { href: "/vs/privnote", title: "ProtectedShare vs Privnote", body: "Keys, passwords and expiry, side by side." },
          { href: "/vs/onetimesecret", title: "ProtectedShare vs OneTimeSecret", body: "Two ways to send a one-time secret." },
        ]}
      />
    </>
  );
}
