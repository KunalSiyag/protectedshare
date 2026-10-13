import type { Metadata } from "next";
import AppLink from "../../../components/app-link";
import JsonLd from "../../../components/json-ld";
import { SITE_URL, breadcrumbJsonLd, faqPageJsonLd, pageMetadata } from "../../../lib/seo";
import { ContentSection, Faq, PointList, RelatedTools } from "../_components/tool-content";
import { JWT_FAQ } from "./faq";
import JwtDecoderClient from "./jwt-decoder-client";

const PATH = "/tools/jwt-decoder";
const DESCRIPTION =
  "Decode a JSON Web Token in your browser: header, claims, expiry in plain words, and HS256/384/512 signature checks. The token is never sent anywhere.";

export const metadata: Metadata = pageMetadata({
  title: "JWT Decoder: Decode and Verify Tokens",
  description: DESCRIPTION,
  path: PATH,
  keywords: ["jwt decoder", "decode jwt", "jwt parser", "jwt verify hs256", "json web token decoder", "jwt expiry checker"],
});

const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ProtectedShare JWT Decoder",
  url: `${SITE_URL}${PATH}`,
  description: DESCRIPTION,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires a browser with Web Crypto.",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Decodes header and payload to formatted JSON",
    "exp, iat and nbf shown as dates with relative times",
    "Expired and not-yet-valid status",
    "Warnings for alg none and risky headers",
    "HS256, HS384 and HS512 signature verification with Web Crypto",
    "Runs in the browser; nothing is sent",
  ],
};

const linkClass = "font-medium text-ink underline decoration-line-strong underline-offset-[3px] hover:decoration-ink";
const code = "rounded-[5px] bg-surface-2 px-[5px] py-px font-mono text-[0.875em] text-ink";

const CLAIMS: { name: string; label: string; body: string }[] = [
  { name: "iss", label: "Issuer", body: "Who created the token, often a URL. Check it matches the issuer you trust." },
  { name: "sub", label: "Subject", body: "Who the token is about, usually a user ID." },
  { name: "aud", label: "Audience", body: "Which service the token is for. A server should reject tokens meant for someone else." },
  { name: "exp", label: "Expiration", body: "After this time, in seconds since 1970, the token must be refused." },
  { name: "nbf", label: "Not before", body: "Before this time the token must be refused." },
  { name: "iat", label: "Issued at", body: "When the token was created. Useful for spotting very old tokens." },
  { name: "jti", label: "JWT ID", body: "A unique ID, so a server can block a token from being replayed." },
];

export default function JwtDecoderPage() {
  return (
    <main className="w-full">
      <JsonLd data={appJsonLd} />
      <JsonLd data={faqPageJsonLd(JWT_FAQ)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Free tools", path: "/tools" },
          { name: "JWT decoder", path: PATH },
        ])}
      />

      <JwtDecoderClient />

      <div className="mt-16 md:mt-20">
        <ContentSection eyebrow="Anatomy" title="Three parts and two dots">
          <PointList
            items={[
              {
                title: "Header",
                body: (
                  <>
                    How the token is signed: <span className={code}>alg</span> such as HS256 or RS256, a <span className={code}>typ</span>,
                    and often a <span className={code}>kid</span> naming the key.
                  </>
                ),
              },
              {
                title: "Payload",
                body: "The claims: who the token is about, who issued it, who it's for, when it expires, plus whatever the app adds.",
              },
              {
                title: "Signature",
                body: "A MAC or digital signature over the first two parts. Change one character of them and it stops matching.",
              },
              {
                title: "Base64url",
                body: "Each part is base64url-encoded JSON or bytes, joined by dots. Encoding isn't encryption: anyone can reverse it.",
              },
            ]}
          />
        </ContentSection>

        <ContentSection eyebrow="Claims" title="The registered claims">
          <dl className="divide-y divide-line border-y border-line">
            {CLAIMS.map((claim) => (
              <div key={claim.name} className="grid gap-1 py-3 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-4">
                <dt>
                  <span className="font-mono text-[15px] text-ink">{claim.name}</span>
                  <span className="ml-2 text-small text-ink-3">{claim.label}</span>
                </dt>
                <dd className="text-[15px] leading-6 text-ink-2">{claim.body}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4">
            The times are plain numbers, seconds since 1 January 1970 UTC. A value with 13 digits is almost always milliseconds by mistake,
            and the decoder flags it, because most libraries would read it as a date thousands of years from now.
          </p>
        </ContentSection>

        <ContentSection eyebrow="Security" title="Decoding isn't verifying">
          <p>
            Anyone can write a JWT with any claims they like. What makes one trustworthy is the signature, checked by the server with a key it
            already holds, never with a key or an algorithm the token asks for. The classic mistakes all break that rule:
          </p>
          <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 marker:text-ink-3">
            <li>
              <span className={code}>alg: none</span> tokens carry no signature at all. Some libraries once accepted them when asked.
            </li>
            <li>
              Algorithm confusion: a server expecting RS256 is handed an HS256 token signed with its own public key as the HMAC secret, and
              verifies it if the code trusts the header&apos;s <span className={code}>alg</span>.
            </li>
            <li>
              Header-supplied keys: <span className={code}>jwk</span>, <span className={code}>jku</span> or{" "}
              <span className={code}>x5u</span> pointing at a key the attacker controls.
            </li>
            <li>Weak HMAC secrets. HS256 secrets can be guessed offline from a single token, so use at least 32 random bytes.</li>
          </ul>
          <p className="mt-4">
            This decoder flags each of these it can see in a token. For a strong HMAC secret, the{" "}
            <AppLink href="/tools/secret-key-generator" className={linkClass}>
              secret key generator
            </AppLink>{" "}
            makes one in your browser.
          </p>
        </ContentSection>

        <ContentSection eyebrow="Privacy" title="Why a decoder should run locally">
          <p>
            A token you&apos;re debugging is often a real one, and a real token is a credential until it expires: whoever holds it is signed in
            as that user. Pasting it into a site that sends it to a server, or logs it in analytics, hands that session to someone else. This
            page decodes with JavaScript in your tab and verifies with your browser&apos;s Web Crypto. There is no request, no storage and no
            history, and the code is open source under the MIT license.
          </p>
          <p className="mt-4">
            When a teammate needs a token or a signing secret, don&apos;t paste it into chat where it stays in the history. Send it with{" "}
            <AppLink href="/secrets" className={linkClass}>
              EnvShare
            </AppLink>
            : it&apos;s encrypted in your browser and deleted after the number of reads you choose.
          </p>
        </ContentSection>

        <ContentSection eyebrow="FAQ" title="Questions">
          <Faq items={JWT_FAQ} />
        </ContentSection>

        <ContentSection title="Related tools">
          <RelatedTools
            items={[
              { href: "/tools/secret-key-generator", title: "Secret key generator", body: "A 256-bit HS256 secret, made in your browser." },
              { href: "/secrets", title: "EnvShare", body: "Send keys and .env files with a read limit." },
              { href: "/tools/encrypt-text", title: "Encrypt text", body: "Lock text into a block only a password opens." },
              { href: "/tools/password-generator", title: "Password generator", body: "Strong passwords and passphrases." },
            ]}
          />
        </ContentSection>
      </div>
    </main>
  );
}
