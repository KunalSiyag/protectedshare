import type { Metadata } from "next";
import ToolGuide, { GuideLink } from "../../components/tool-guide";
import { pageMetadata } from "../../lib/seo";
import type { FaqItem } from "../tools/_components/tool-content";
import FilesClient from "./files-client";

const DESCRIPTION =
  "Send files up to 25 MB, encrypted in your browser before upload. Names stay private, and files are deleted after the downloads you allow. No signup.";

export const metadata: Metadata = pageMetadata({
  title: "Send Files Securely: Encrypted Transfer",
  description: DESCRIPTION,
  path: "/files",
  keywords: [
    "send files securely",
    "encrypted file transfer",
    "send encrypted files",
    "secure file sharing",
    "send files without signup",
    "wetransfer alternative",
  ],
});

const FAQ: FaqItem[] = [
  {
    question: "Do I or the recipient need an account?",
    answer:
      "No. You send from the browser and they download in theirs. Neither of you needs an account, an email address or an app.",
  },
  {
    question: "Can ProtectedShare see my files?",
    answer:
      "No. Files are encrypted in your browser before upload, and their names, types and your message travel in an encrypted manifest. The server stores ciphertext. The key stays after the # in the link, which browsers don't send to servers.",
  },
  {
    question: "How big can the files be?",
    answer:
      "Up to 25 MB per drop, across as many as 100 files. For anything larger, split it across several drops.",
  },
  {
    question: "What does the recipient see?",
    answer:
      "A page that decrypts your files and message in their browser. They can save each file or all of them, and common image types can be previewed first. The page warns them before they close a tab with files still unsaved.",
  },
  {
    question: "When are the files deleted?",
    answer:
      "A download counts as soon as it starts. When the last download you allowed finishes, the encrypted files are deleted from the server. Drops nobody downloads are deleted at expiry, and uploads that never finish are deleted after 6 hours.",
  },
  {
    question: "Can the recipient forward the files?",
    answer:
      "Yes. Once they're decrypted and saved, they're ordinary files on the recipient's device. The download limit controls the copy on our server, not what happens after.",
  },
  {
    question: "I sent it to the wrong person. Can I take it back?",
    answer:
      "Yes. Delete the drop from the confirmation screen, or from My links in the same browser, and the encrypted files are removed from the server straight away. If they already downloaded it, they keep their copy.",
  },
];

export default function FilesPage() {
  return (
    <>
      <FilesClient />
      <ToolGuide
        appName="ProtectedShare File Drop"
        path="/files"
        description="Send files securely: they're encrypted in your browser before upload, shared with a link, and deleted after the downloads you allow."
        features={[
          "AES-256-GCM encryption in the browser, in 1 MB chunks",
          "File names, types and message kept in an encrypted manifest",
          "Up to 25 MB and 100 files per drop",
          "Download limit from 1 to 100",
          "Expiry from 1 hour to 30 days",
          "Image previews for the recipient",
          "No account for sender or recipient",
        ]}
        breadcrumb="File drop"
        how={{
          title: "How to send a file securely",
          steps: [
            {
              title: "Add your files",
              body: "Choose up to 100 files, 25 MB in all, and add a message if you like. Pick a download limit and an expiry.",
            },
            {
              title: "Encrypted, then uploaded",
              body: "Your browser encrypts each file in 1 MB chunks with AES-256-GCM. Names, types and your message go into an encrypted manifest.",
            },
            {
              title: "They download and decrypt",
              body: "The key is after the # in the link. Their browser fetches the chunks, checks and decrypts them, and saves the files.",
            },
          ],
        }}
        uses={{
          title: "When an email attachment is the wrong place",
          items: [
            {
              title: "Contracts and IDs",
              body: "Signed contracts, passport scans and tax forms that shouldn't sit in two inboxes for years.",
            },
            {
              title: "Keys and certificates",
              body: "SSH keys, TLS certificates and keystores: files that are secrets themselves.",
            },
            {
              title: "Client handoffs",
              body: "Deliver a database export or a design file once, with a download limit, instead of a shared folder that stays open.",
            },
            {
              title: "Private photos",
              body: "Send photos to one person with a single download and a short expiry.",
            },
          ],
        }}
        limits={{
          title: "Size limits and what the server sees",
          items: [
            {
              label: "Encryption",
              value: "AES-256-GCM per 1 MB chunk, each bound to its position in the drop so chunks can't be reordered or swapped. The key is a random 256-bit value in the link.",
            },
            { label: "Size", value: "Up to 25 MB and 100 files per drop. An optional message of up to 2,000 characters." },
            {
              label: "Downloads",
              value: "1 to 100. A download counts when it starts, and cancelling doesn't give it back. After the last one finishes, the files are deleted.",
            },
            {
              label: "Expiry",
              value: "1 hour, 1 day, 7 days, or a date up to 30 days out. Uploads that never finish are deleted after 6 hours.",
            },
            {
              label: "Server sees",
              value: "The total encrypted size, the number of chunks, downloads remaining and the expiry, plus hashes it uses to check the key and the upload.",
            },
            {
              label: "Never sent",
              value: "File names, types and sizes of individual files, your message, the contents and the key.",
            },
          ],
          footnote: (
            <>
              The full list is on the <GuideLink href="/privacy">privacy page</GuideLink>. To share text instead of a file,
              a <GuideLink href="/notes">secure note</GuideLink> is quicker.
            </>
          ),
        }}
        faq={{ title: "Sending files securely", items: FAQ }}
        related={[
          { href: "/notes", title: "Secure note", body: "Send text that burns after reading." },
          { href: "/secrets", title: "EnvShare", body: "Share .env files and API keys with a read limit." },
          { href: "/request", title: "Secret request", body: "Ask someone to send you a password." },
          { href: "/tools/encrypt-text", title: "Encrypt text", body: "Lock text with a password, offline." },
          { href: "/vs/wetransfer", title: "ProtectedShare vs WeTransfer", body: "How file drops compare with WeTransfer." },
          { href: "/vs/firefox-send", title: "ProtectedShare vs Firefox Send", body: "How file drops compare with Firefox Send." },
        ]}
      />
    </>
  );
}
