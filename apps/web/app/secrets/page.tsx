import type { Metadata } from "next";
import ToolGuide, { GuideLink } from "../../components/tool-guide";
import { pageMetadata } from "../../lib/seo";
import type { FaqItem } from "../tools/_components/tool-content";
import SecretsClient from "./secrets-client";

const DESCRIPTION =
  "Share a .env file, API key or token as an encrypted link that deletes itself after 1 to 100 reads or up to 30 days. Encrypted in your browser.";

export const metadata: Metadata = pageMetadata({
  title: "Share .env Files and API Keys Securely",
  description: DESCRIPTION,
  path: "/secrets",
  keywords: [
    "share env file securely",
    "share api key securely",
    "send api key",
    "share credentials securely",
    "envshare",
    "one-time secret",
  ],
});

const FAQ: FaqItem[] = [
  {
    question: "Is it safe to share an API key with a link?",
    answer:
      "Safer than chat or email, where a key stays in the history indefinitely. EnvShare encrypts the key in your browser, the link works only for the reads you allow, and the server deletes the ciphertext after the last one. Until then anyone holding the full link can read it, so treat the link like the key.",
  },
  {
    question: "Can ProtectedShare see my secrets?",
    answer:
      "No. The server stores ciphertext and a hash it uses to check the reader's key. The key sits after the # in the link, which browsers don't send to servers. The code is open source under the MIT license, so you can check.",
  },
  {
    question: "Do link previews or bots use up reads?",
    answer:
      "No. Loading the page doesn't use a read: the reader has to click Open first. A preview bot also never gets the key, because the part of the link after the # isn't sent to servers.",
  },
  {
    question: "Can the recipient keep a copy?",
    answer:
      "Yes. Once it's decrypted on their screen they can copy it, download it or take a screenshot, and nothing can prevent that. A read limit controls the copy on our server, not theirs. Share credentials you can rotate, and rotate the important ones after the handoff.",
  },
  {
    question: "How is EnvShare different from a secure note?",
    answer:
      "Both encrypt in your browser. EnvShare is built for credentials: it takes up to 200,000 characters or a .env file, allows 1 to 100 reads, and shows the reader each variable with its own copy button. A secure note is for one reader, with Markdown and an option for password-only links.",
  },
  {
    question: "Should I use a secrets manager instead?",
    answer:
      "For secrets your apps use every day, yes. A vault or your platform's secret store is the right home for them. EnvShare is for the handoff between people, like onboarding a developer or giving a contractor a key, where setting up shared vault access would be overkill.",
  },
  {
    question: "How do I know if it was opened?",
    answer:
      "My links, in the browser that created the link, shows how many reads were used and when it was first and last opened. You can delete the secret there before anyone reads it.",
  },
];

export default function SecretsPage() {
  return (
    <>
      <SecretsClient />
      <ToolGuide
        appName="ProtectedShare EnvShare"
        path="/secrets"
        description="Share .env files, API keys and tokens as an encrypted link with a read limit of 1 to 100 and an expiry of up to 30 days."
        features={[
          "AES-256-GCM encryption in the browser",
          "Key in the link fragment, with an optional password",
          "Read limit from 1 to 100",
          "Expiry from 1 hour to 30 days",
          "Open a .env file or paste up to 200,000 characters",
          "Reader gets per-variable copy buttons and a .env download",
          "No account for sender or reader",
        ]}
        breadcrumb="EnvShare"
        how={{
          title: "How to share a .env file securely",
          steps: [
            {
              title: "Paste or open the file",
              body: "Paste the variables or open a .env file from your device. It's read in this browser and encrypted with AES-256-GCM before upload.",
            },
            {
              title: "Set reads and expiry",
              body: "Choose how many times the link can be opened, from 1 to 100, and when it expires. Add a password if the link travels somewhere shared.",
            },
            {
              title: "They open it, then it's gone",
              body: "Their browser decrypts it and lists each variable with a copy button, or saves it as a .env file. After the last read the server deletes it.",
            },
          ],
        }}
        uses={{
          title: "Built for the credentials developers pass around",
          items: [
            {
              title: "Onboarding a teammate",
              body: "Hand over a project's local .env in one link instead of a wall of pasted lines in Slack.",
            },
            {
              title: "A key for a contractor",
              body: "Give a freelancer one API key with one read and a short expiry, then rotate it when the work ends.",
            },
            {
              title: "Setting up CI or a deploy",
              body: "Move a token from your machine to whoever is configuring the pipeline without it landing in an issue or a wiki.",
            },
            {
              title: "A few readers, one value",
              body: "Allow 3 or 5 reads when several people need the same secret. The link stops working after the last one.",
            },
          ],
        }}
        limits={{
          title: "Read limits, expiry and what we store",
          items: [
            {
              label: "Encryption",
              value: "AES-256-GCM in your browser with a random 256-bit key carried after the # in the link. An optional password is stretched with PBKDF2-SHA256 (600,000 rounds).",
            },
            {
              label: "Server keeps",
              value: "Ciphertext, IV, salt, the encryption mode, a hash it checks before each read, the reads remaining and the expiry time.",
            },
            { label: "Never sent", value: "Your variables, the key in the link and the password." },
            {
              label: "Size",
              value: "Up to 200,000 characters of text. Files up to 256 KB can be opened; binary files are refused.",
            },
            { label: "Reads", value: "1 to 100. Each open uses one, and the read that uses up the limit deletes the secret." },
            { label: "Expiry", value: "1 hour, 1 day, 7 days, or a date you pick up to 30 days out." },
            {
              label: "Key detection",
              value: "Common formats such as AWS, Stripe, GitHub and Slack keys, private keys, JWTs and database URLs are recognised in your browser to label what you pasted. Nothing about them is sent.",
            },
          ],
          footnote: (
            <>
              Every stored field is listed on the <GuideLink href="/privacy">privacy page</GuideLink>. For habits that keep
              shared keys safe, read <GuideLink href="/blog/how-to-share-env-files-securely">how to share .env files securely</GuideLink>.
            </>
          ),
        }}
        faq={{ title: "Sharing secrets with EnvShare", items: FAQ }}
        related={[
          { href: "/notes", title: "Secure note", body: "A one-time note that burns after reading." },
          { href: "/request", title: "Secret request", body: "Have someone send a key to you, encrypted to you." },
          { href: "/files", title: "File drop", body: "Send encrypted files up to 25 MB." },
          { href: "/tools/secret-key-generator", title: "Secret key generator", body: "Make random keys in your browser." },
          { href: "/tools/jwt-decoder", title: "JWT decoder", body: "Read a token's claims without sending it anywhere." },
          { href: "/vs/envshare", title: "ProtectedShare vs EnvShare", body: "Two ways to share .env files, compared." },
        ]}
      />
    </>
  );
}
