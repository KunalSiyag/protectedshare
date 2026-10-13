import type { Metadata } from "next";
import AppLink from "../../../components/app-link";
import JsonLd from "../../../components/json-ld";
import { SITE_URL, breadcrumbJsonLd, faqPageJsonLd, pageMetadata } from "../../../lib/seo";
import { ContentSection, Faq, PointList, RelatedTools } from "../_components/tool-content";
import BreachCheckerClient from "./breach-checker-client";
import { BREACH_FAQ } from "./faq";

const PATH = "/tools/breached-password-checker";
const DESCRIPTION =
  "Check if a password appears in known data breaches. Only 5 characters of its SHA-1 hash leave your browser, via Have I Been Pwned's k-anonymity API.";

export const metadata: Metadata = pageMetadata({
  title: "Breached Password Checker",
  description: DESCRIPTION,
  path: PATH,
  keywords: [
    "breached password checker",
    "has my password been leaked",
    "pwned password check",
    "have i been pwned password",
    "password breach check",
    "k-anonymity password check",
  ],
});

const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ProtectedShare Breached Password Checker",
  url: `${SITE_URL}${PATH}`,
  description: DESCRIPTION,
  applicationCategory: "SecurityApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires a browser with Web Crypto.",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Checks the Pwned Passwords list from Have I Been Pwned",
    "k-anonymity: only the first 5 characters of the SHA-1 hash are sent",
    "Padded responses",
    "Breach count for the password",
    "Shows the exact request that leaves the browser",
  ],
};

const linkClass = "font-medium text-ink underline decoration-line-strong underline-offset-[3px] hover:decoration-ink";
const code = "rounded-[5px] bg-surface-2 px-[5px] py-px font-mono text-[0.875em] text-ink";

export default function BreachedPasswordCheckerPage() {
  return (
    <main className="w-full">
      <JsonLd data={appJsonLd} />
      <JsonLd data={faqPageJsonLd(BREACH_FAQ)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Free tools", path: "/tools" },
          { name: "Breached password checker", path: PATH },
        ])}
      />

      <BreachCheckerClient />

      <div className="mt-16 md:mt-20">
        <ContentSection eyebrow="How it works" title="Checked without sending the password">
          <PointList
            items={[
              {
                title: "Hash it here",
                body: (
                  <>
                    Your browser runs the password through SHA-1. <span className={code}>password</span> becomes{" "}
                    <span className="break-all font-mono text-[13px] text-ink">5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8</span>.
                  </>
                ),
              },
              {
                title: "Send five characters",
                body: (
                  <>
                    Only <span className={code}>5BAA6</span> goes to Have I Been Pwned. There are about a million possible five-character
                    prefixes, and each is shared by hundreds of breached passwords.
                  </>
                ),
              },
              {
                title: "Get the whole bucket back",
                body: "The service returns every hash ending that starts with those five characters, with a count for each. Padding adds dummy rows, so even the reply's size gives nothing away.",
              },
              {
                title: "Match it here",
                body: "Your browser looks for the other 35 characters in that list. The answer, like the password, stays in the tab.",
              },
            ]}
          />
        </ContentSection>

        <ContentSection eyebrow="k-anonymity" title="Why five characters are safe to send">
          <p>
            k-anonymity means your question looks the same as many other people&apos;s. When this page asks for{" "}
            <span className={code}>5BAA6</span>, the service learns that you&apos;re interested in one of the hundreds of hashes starting
            with those characters, or in one that isn&apos;t on the list at all. It can&apos;t narrow it down further, and it never sees the
            password or the full hash. Have I Been Pwned designed the API this way so that services can check passwords at sign-up without
            handing them over.
          </p>
          <p className="mt-4">
            The request goes straight from your browser to <span className={code}>api.pwnedpasswords.com</span>, not through our server.
            The panel beside the tool shows it exactly, with the five characters it will carry, before you press Check. Nothing is sent while
            you type, and no cookies or referrer go with it.
          </p>
        </ContentSection>

        <ContentSection eyebrow="Results" title="What a result means">
          <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-ink-3">
            <li>
              <span className="text-ink">Found</span> means the password appears in breach data that attackers already use. They try those
              passwords first, against every kind of login, so stop using it anywhere and change it wherever it&apos;s in use.
            </li>
            <li>
              The <span className="text-ink">count</span> is how many times it was seen across breaches. A count in the millions means it&apos;s
              one of the first guesses any attacker makes. Even a count of 1 is enough to retire it.
            </li>
            <li>
              <span className="text-ink">Not found</span> means it isn&apos;t in the data collected so far. It says nothing about strength:
              check that with the{" "}
              <AppLink href="/tools/password-strength-checker" className={linkClass}>
                password strength checker
              </AppLink>
              .
            </li>
          </ul>
          <p className="mt-4">
            Checking passwords against breach lists isn&apos;t only for individuals. NIST&apos;s digital identity guidelines (SP 800-63B)
            tell services to compare new passwords with lists of compromised ones and reject matches.
          </p>
        </ContentSection>

        <ContentSection eyebrow="Next step" title="Replace it, then send it safely">
          <p>
            Make the replacement with the{" "}
            <AppLink href="/tools/password-generator" className={linkClass}>
              password generator
            </AppLink>
            , and keep it in a password manager. If the new password has to reach someone else, don&apos;t paste it into chat or email where
            it stays in the history. A{" "}
            <AppLink href="/notes" className={linkClass}>
              secure note
            </AppLink>{" "}
            is encrypted in your browser and can delete itself after one read.
          </p>
        </ContentSection>

        <ContentSection eyebrow="Data" title="Where the data comes from">
          <p>
            Results come from{" "}
            <a href="https://haveibeenpwned.com/Passwords" className={linkClass}>
              Pwned Passwords
            </a>{" "}
            by Have I Been Pwned, a free service that collects passwords exposed in earlier data breaches and counts how often each was seen.
            ProtectedShare isn&apos;t affiliated with Have I Been Pwned; this page calls its public range API from your browser.
          </p>
        </ContentSection>

        <ContentSection eyebrow="FAQ" title="Questions">
          <Faq items={BREACH_FAQ} />
        </ContentSection>

        <ContentSection title="Related tools">
          <RelatedTools
            items={[
              { href: "/tools/password-generator", title: "Password generator", body: "A random replacement, made in your browser." },
              { href: "/tools/password-strength-checker", title: "Password strength checker", body: "How guessable a password is, with reasons." },
              { href: "/notes", title: "Secure note", body: "Send the new password as a link that burns after reading." },
              { href: "/request", title: "Secret request", body: "Ask someone to send you a password, encrypted to you." },
            ]}
          />
        </ContentSection>
      </div>
    </main>
  );
}
