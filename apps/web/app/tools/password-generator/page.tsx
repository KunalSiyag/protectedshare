import type { Metadata } from "next";
import JsonLd from "../../../components/json-ld";
import { SITE_URL, breadcrumbJsonLd, faqPageJsonLd, pageMetadata } from "../../../lib/seo";
import { ContentSection, Faq, PointList, RelatedTools } from "../_components/tool-content";
import PasswordGeneratorClient from "./password-generator-client";
import { PASSWORD_FAQ } from "./faq";

const DESCRIPTION =
  "Generate strong passwords, passphrases and PINs in your browser. See the entropy and an honest crack-time estimate. Nothing is sent or stored.";

export const metadata: Metadata = pageMetadata({
  title: "Strong Password Generator",
  description: DESCRIPTION,
  path: "/tools/password-generator",
  keywords: [
    "password generator",
    "strong password generator",
    "passphrase generator",
    "random password",
    "pin generator",
    "password strength checker",
    "password entropy",
  ],
});

const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ProtectedShare Password Generator",
  url: `${SITE_URL}/tools/password-generator`,
  description: DESCRIPTION,
  applicationCategory: "SecurityApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires a browser with Web Crypto.",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Random passwords from 8 to 128 characters",
    "Passphrases from 3 to 12 words",
    "Numeric PINs from 4 to 12 digits",
    "Entropy and crack-time estimate",
    "Local password strength checker",
  ],
};

export default function PasswordGeneratorPage() {
  return (
    <>
      <JsonLd data={appJsonLd} />
      <JsonLd data={faqPageJsonLd(PASSWORD_FAQ)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Free tools", path: "/tools" },
          { name: "Password generator", path: "/tools/password-generator" },
        ])}
      />

      <PasswordGeneratorClient />

      <div className="mt-16 md:mt-20">
        <ContentSection eyebrow="Guide" title="What makes a password strong">
          <PointList
            items={[
              {
                title: "Randomness, not cleverness",
                body: "A password is as strong as the number of equally likely options it was picked from. Swapping a for @ in a word adds almost nothing; attackers try those swaps first.",
              },
              {
                title: "Length beats symbols",
                body: "Each extra character multiplies the work. A 20-character lowercase password is stronger than a 10-character one with every symbol on the keyboard.",
              },
              {
                title: "One password per site",
                body: "Most accounts are broken with passwords leaked from somewhere else. A unique password for each site stops one breach from becoming ten.",
              },
              {
                title: "Let a manager remember them",
                body: "Use a password manager for the long random ones. Keep one strong passphrase in your head to unlock it.",
              },
            ]}
          />
        </ContentSection>

        <ContentSection eyebrow="Passphrases" title="Words you can type, entropy you can count">
          <p>
            A passphrase is a few words picked at random, like <span className="font-mono text-[15px] text-ink">harbor-velvet-pilot-ember</span>. Each word
            from our 1,629-word list adds about 10.7 bits. Five words give about 53 bits, six about 64. The words must be chosen by the
            generator, not by you: people pick words that go together, and attackers know it.
          </p>
          <p className="mt-4">
            Turn on <span className="text-ink">Capitalize</span> or <span className="text-ink">Include a number</span> when a site insists on them.
            They add a little entropy, but adding a word adds more.
          </p>
        </ContentSection>

        <ContentSection eyebrow="Privacy" title="Why it runs in your browser">
          <p>
            Generating a password on a server means trusting that server not to keep a copy. This page doesn&apos;t ask for that trust. It draws
            from <span className="font-mono text-[15px] text-ink">crypto.getRandomValues</span>, rejects biased samples so every character is
            equally likely, and never makes a network request with the result. History stays in this tab&apos;s memory and is gone on reload.
          </p>
        </ContentSection>

        <ContentSection eyebrow="FAQ" title="Questions">
          <Faq items={PASSWORD_FAQ} />
        </ContentSection>

        <ContentSection title="Related tools">
          <RelatedTools
            items={[
              { href: "/notes", title: "Secure note", body: "Send a password as a link that can burn after one read." },
              { href: "/tools/encrypt-text", title: "Encrypt text", body: "Lock text into a block only a password opens." },
              { href: "/secrets", title: "EnvShare", body: "Share .env files and API keys with a read limit." },
              { href: "/request", title: "Secret request", body: "Ask someone to send you a password, encrypted to you." },
            ]}
          />
        </ContentSection>
      </div>
    </>
  );
}
