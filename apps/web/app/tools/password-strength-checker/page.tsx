import type { Metadata } from "next";
import AppLink from "../../../components/app-link";
import JsonLd from "../../../components/json-ld";
import { SITE_URL, breadcrumbJsonLd, faqPageJsonLd, pageMetadata } from "../../../lib/seo";
import { ContentSection, Faq, PointList, RelatedTools } from "../_components/tool-content";
import { STRENGTH_FAQ } from "./faq";
import StrengthCheckerClient from "./strength-checker-client";

const PATH = "/tools/password-strength-checker";
const DESCRIPTION =
  "Check how strong a password is without sending it anywhere. See its entropy, crack-time estimates and plain reasons. Runs in your browser.";

export const metadata: Metadata = pageMetadata({
  title: "Password Strength Checker",
  description: DESCRIPTION,
  path: PATH,
  keywords: [
    "password strength checker",
    "password strength test",
    "how strong is my password",
    "password entropy calculator",
    "password crack time",
    "check password strength",
  ],
});

const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ProtectedShare Password Strength Checker",
  url: `${SITE_URL}${PATH}`,
  description: DESCRIPTION,
  applicationCategory: "SecurityApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires a modern browser with JavaScript.",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Entropy estimate in bits",
    "Offline and online crack-time estimates",
    "Plain-language findings: common passwords, words, years, repeats, sequences, keyboard walks",
    "Breakdown of where the entropy comes from",
    "Runs in the browser; nothing is sent",
  ],
};

const linkClass = "font-medium text-ink underline decoration-line-strong underline-offset-[3px] hover:decoration-ink";
const code = "rounded-[5px] bg-surface-2 px-[5px] py-px font-mono text-[0.875em] text-ink";

export default function PasswordStrengthCheckerPage() {
  return (
    <main className="w-full">
      <JsonLd data={appJsonLd} />
      <JsonLd data={faqPageJsonLd(STRENGTH_FAQ)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Free tools", path: "/tools" },
          { name: "Password strength checker", path: PATH },
        ])}
      />

      <StrengthCheckerClient />

      <div className="mt-16 md:mt-20">
        <ContentSection eyebrow="How it scores" title="Priced the way an attacker guesses">
          <PointList
            items={[
              {
                title: "Start from the characters",
                body: "Lowercase alone gives 26 options per character; add capitals, digits and symbols and it's about 95. That sets the price of a truly random character.",
              },
              {
                title: "Charge less for patterns",
                body: "Common passwords and words, years, repeated characters, runs like abc or 123, and keys next to each other cost an attacker very few guesses.",
              },
              {
                title: "Take the cheapest reading",
                body: "The checker splits the password the way that makes it easiest to guess, and adds up the pieces. That's the number you see.",
              },
              {
                title: "Turn bits into time",
                body: "Half the guesses, at two speeds: a GPU rig against a leaked fast hash, and a login that doesn't slow down wrong attempts.",
              },
            ]}
          />
        </ContentSection>

        <ContentSection eyebrow="Example" title="Why P@ssw0rd2024! is weak">
          <p>
            It&apos;s 13 characters with every character type, which a rule-based meter would call strong. An attacker sees three pieces:{" "}
            <span className={code}>P@ssw0rd</span>, one of the most common passwords there is, with the two swaps everyone makes;{" "}
            <span className={code}>2024</span>, a recent year; and <span className={code}>!</span>, the symbol people tack on most. Guessing
            tools try exactly those combinations first. Priced that way it comes to about 24 bits, which a fast offline attack gets through in
            well under a second.
          </p>
          <p className="mt-4">
            Compare a random 13-character password from the same character set: about 85 bits, out of reach of any known guessing attack. The
            length and character types are the same. The difference is that nobody chose the characters.
          </p>
        </ContentSection>

        <ContentSection eyebrow="Limits" title="What the estimate can't see">
          <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-ink-3">
            <li>
              Its list of common passwords and words is short, so it runs instantly in the page. Real attackers use lists with billions of
              entries.
            </li>
            <li>It doesn&apos;t know you. A name, a street or a team that means something to you is easy for someone who does.</li>
            <li>
              It can&apos;t tell whether a password has already leaked. The{" "}
              <AppLink href="/tools/breached-password-checker" className={linkClass}>
                breached password checker
              </AppLink>{" "}
              can, without sending the password.
            </li>
            <li>
              Passwords from the{" "}
              <AppLink href="/tools/password-generator" className={linkClass}>
                password generator
              </AppLink>{" "}
              don&apos;t need guessing: it knows how they were made and shows their exact entropy.
            </li>
          </ul>
        </ContentSection>

        <ContentSection eyebrow="Fixing it" title="How to make a weak password strong">
          <p>
            Don&apos;t edit it. Adding a digit or swapping a letter for a symbol is exactly what guessing tools expect. Replace it with something
            random: a password generator for logins you never type by hand, and a passphrase of random words for the few you do, like a
            laptop or a password manager. Then use each password in one place only. Most accounts are broken with passwords that leaked
            somewhere else, and no amount of strength helps a password that&apos;s already on a list.
          </p>
          <p className="mt-4">
            If you have to send a new password to someone, don&apos;t paste it into chat or email where it stays. A{" "}
            <AppLink href="/notes" className={linkClass}>
              secure note
            </AppLink>{" "}
            is encrypted in your browser and can delete itself after one read.
          </p>
        </ContentSection>

        <ContentSection eyebrow="Privacy" title="Why nothing is sent">
          <p>
            Some strength meters send what you type to a server to score it, and you can&apos;t see what that server keeps. This one is a
            short piece of JavaScript running in your tab: no request, no storage, no history. Once the page has loaded it works with the
            network off. The code is open source under the MIT license.
          </p>
        </ContentSection>

        <ContentSection eyebrow="FAQ" title="Questions">
          <Faq items={STRENGTH_FAQ} />
        </ContentSection>

        <ContentSection title="Related tools">
          <RelatedTools
            items={[
              { href: "/tools/password-generator", title: "Password generator", body: "Random passwords and passphrases with exact entropy." },
              { href: "/tools/breached-password-checker", title: "Breached password checker", body: "See if a password is in a known breach." },
              { href: "/notes", title: "Secure note", body: "Send a password as a link that can burn after one read." },
              { href: "/tools/secret-key-generator", title: "Secret key generator", body: "Random keys and tokens for apps and .env files." },
            ]}
          />
        </ContentSection>
      </div>
    </main>
  );
}
