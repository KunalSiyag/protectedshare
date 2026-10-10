import type { Metadata } from "next";
import JsonLd from "../../../components/json-ld";
import { SITE_URL, breadcrumbJsonLd, faqPageJsonLd, pageMetadata } from "../../../lib/seo";
import type { FaqItem } from "../_components/tool-content";
import { ContentSection, Faq, PointList, RelatedTools } from "../_components/tool-content";
import EncryptTextClient from "./encrypt-text-client";

const DESCRIPTION =
  "Encrypt text with a password in your browser and get a block you can paste anywhere. AES-256-GCM, decrypts offline, nothing is uploaded.";

export const metadata: Metadata = pageMetadata({
  title: "Encrypt Text Online with a Password",
  description: DESCRIPTION,
  path: "/tools/encrypt-text",
  keywords: [
    "encrypt text online",
    "encrypt text with password",
    "decrypt text online",
    "text encryption tool",
    "aes text encryption",
    "offline encryption",
  ],
});

const FAQ: FaqItem[] = [
  {
    question: "Is my text sent to your server?",
    answer:
      "No. The text and password are processed by JavaScript in this tab, in a Web Worker. The tool has no upload endpoint. The page itself loads from our server like any website; after it has loaded you can disconnect and it keeps working.",
  },
  {
    question: "What encryption does it use?",
    answer:
      "Your password is stretched with PBKDF2-SHA256 at 600,000 iterations with a random 16-byte salt, then HKDF-SHA256 derives an AES-256-GCM key. A random 12-byte IV is used for each message. GCM also detects any change to the block, so a tampered block fails to open instead of decrypting to garbage.",
  },
  {
    question: "What if I forget the password?",
    answer:
      "The text can't be recovered. There's no reset and no copy anywhere else. That's the point, so store the password in a password manager.",
  },
  {
    question: "How strong does the password need to be?",
    answer:
      "Anyone who gets the block can try passwords offline as fast as their hardware allows, with no rate limit. The 600,000-iteration stretch slows each guess, but a short or common password will still fall. Use the Generate button for a five-word passphrase, or a long random password.",
  },
  {
    question: "Can someone open the block without this website?",
    answer:
      "Yes. The format is documented on the page: salt, IV and ciphertext in base64url, using standard algorithms that any mainstream crypto library can reproduce. The code is open source under the MIT license.",
  },
  {
    question: "How is this different from a secure note?",
    answer:
      "A secure note stores ciphertext on our server and gives you a link that can expire or burn after one read. This tool stores nothing: you keep the block and decide where it goes. Use a note to hand off a secret, and this tool to keep or send an encrypted copy yourself.",
  },
];

const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ProtectedShare Encrypt Text",
  url: `${SITE_URL}/tools/encrypt-text`,
  description: DESCRIPTION,
  applicationCategory: "SecurityApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires a browser with Web Crypto.",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "AES-256-GCM with PBKDF2-SHA256 (600,000 iterations)",
    "Armored text block that can be pasted anywhere",
    "Works offline after the page loads",
    "Download as .txt",
  ],
};

export default function EncryptTextPage() {
  return (
    <>
      <JsonLd data={appJsonLd} />
      <JsonLd data={faqPageJsonLd(FAQ)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Free tools", path: "/tools" },
          { name: "Encrypt text", path: "/tools/encrypt-text" },
        ])}
      />

      <EncryptTextClient />

      <div className="mt-16 md:mt-20">
        <ContentSection eyebrow="How it works" title="A password in, a sealed block out">
          <PointList
            items={[
              {
                title: "Stretch the password",
                body: "PBKDF2-SHA256 runs 600,000 times with a fresh random salt, so every guess an attacker makes costs real time.",
              },
              {
                title: "Encrypt and sign",
                body: "AES-256-GCM encrypts the text and adds a 16-byte tag. Change one character of the block and it refuses to open.",
              },
              {
                title: "Wrap it as text",
                body: "Salt, IV and ciphertext are joined and wrapped between BEGIN and END lines, so email, chat and notes apps leave it intact.",
              },
              {
                title: "Open it anywhere",
                body: "Paste the block back here with the password, on any device. No account, no server, no expiry.",
              },
            ]}
          />
        </ContentSection>

        <ContentSection eyebrow="Format" title="What the block looks like">
          <pre className="overflow-x-auto rounded-field border border-line bg-surface px-4 py-3.5 font-mono text-[12.5px] leading-5 text-ink-2">
{`-----BEGIN PROTECTEDSHARE MESSAGE-----
Version: 2 (AES-256-GCM, PBKDF2-SHA256 600k, HKDF)

<salt>.<iv>.<ciphertext>          base64url, wrapped at 64 columns
-----END PROTECTEDSHARE MESSAGE-----`}
          </pre>
          <p className="mt-4">
            The AES key comes from HKDF-SHA256 over the stretched password with the info string{" "}
            <span className="font-mono text-[15px] text-ink">ps/v2/enc</span>, and the additional authenticated data is{" "}
            <span className="font-mono text-[15px] text-ink">ps/v2/password</span>. Nothing about you or the text is in the header.
          </p>
        </ContentSection>

        <ContentSection eyebrow="Use it for" title="When a block beats a link">
          <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-ink-3">
            <li>Keeping recovery codes or a seed phrase in a notes app or cloud drive you don&apos;t fully trust.</li>
            <li>Sending a secret through a channel that keeps history, when you can share the password another way.</li>
            <li>Storing an encrypted copy of a secret for longer than our 30-day link limit.</li>
          </ul>
        </ContentSection>

        <ContentSection eyebrow="FAQ" title="Questions">
          <Faq items={FAQ} />
        </ContentSection>

        <ContentSection title="Related tools">
          <RelatedTools
            items={[
              { href: "/tools/password-generator", title: "Password generator", body: "Make a strong passphrase for your block." },
              { href: "/notes", title: "Secure note", body: "A link that opens once, then deletes the note." },
              { href: "/notepad", title: "Notepad", body: "Encrypted notes that stay in your browser." },
              { href: "/files", title: "File drop", body: "Encrypted files up to 25 MB, with a download limit." },
            ]}
          />
        </ContentSection>
      </div>
    </>
  );
}
