import type { Metadata } from "next";
import AppLink from "../../../components/app-link";
import JsonLd from "../../../components/json-ld";
import { SITE_URL, breadcrumbJsonLd, faqPageJsonLd, pageMetadata } from "../../../lib/seo";
import { ContentSection, Faq, PointList, RelatedTools } from "../_components/tool-content";
import { KEYS_FAQ } from "./faq";
import SecretKeyClient from "./secret-key-client";

const PATH = "/tools/secret-key-generator";
const DESCRIPTION =
  "Generate random secret keys in your browser: hex, base64, UUIDs, JWT secrets, Django SECRET_KEY, Rails secret_key_base, AUTH_SECRET and API keys.";

export const metadata: Metadata = pageMetadata({
  title: "Secret Key Generator for Apps and .env",
  description: DESCRIPTION,
  path: PATH,
  keywords: [
    "secret key generator",
    "random key generator",
    "jwt secret generator",
    "django secret key generator",
    "rails secret_key_base",
    "nextauth secret generator",
    "api key generator",
  ],
});

const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ProtectedShare Secret Key Generator",
  url: `${SITE_URL}${PATH}`,
  description: DESCRIPTION,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires a browser with Web Crypto.",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Random bytes from 16 to 128 as hex, base64 or base64url",
    "JWT HS256 secret, Django SECRET_KEY, Rails secret_key_base, Auth.js AUTH_SECRET",
    "API keys with a custom prefix and a SHA-256 to store",
    "UUID v4",
    "Ready-to-paste .env line",
    "Runs in the browser; nothing is sent",
  ],
};

const linkClass = "font-medium text-ink underline decoration-line-strong underline-offset-[3px] hover:decoration-ink";
const code = "rounded-[5px] bg-surface-2 px-[5px] py-px font-mono text-[0.875em] text-ink";

export default function SecretKeyGeneratorPage() {
  return (
    <main className="w-full">
      <JsonLd data={appJsonLd} />
      <JsonLd data={faqPageJsonLd(KEYS_FAQ)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Free tools", path: "/tools" },
          { name: "Secret key generator", path: PATH },
        ])}
      />

      <SecretKeyClient />

      <div className="mt-16 md:mt-20">
        <ContentSection eyebrow="Formats" title="The right key for the framework">
          <PointList
            items={[
              {
                title: "JWT HS256 secret",
                body: "32 random bytes as base64url, 256 bits. HMAC-signed tokens are only as strong as this secret.",
              },
              {
                title: "Django SECRET_KEY",
                body: "50 characters from the alphabet Django's own get_random_secret_key() uses. It signs sessions, password-reset links and messages.",
              },
              {
                title: "Rails secret_key_base",
                body: "64 random bytes as 128 hex characters, the same shape bin/rails secret prints. Rails derives its cookie and message keys from it.",
              },
              {
                title: "Auth.js AUTH_SECRET",
                body: "32 random bytes as base64, the same shape as openssl rand -base64 32. Auth.js uses it to encrypt session tokens.",
              },
              {
                title: "API keys",
                body: "A prefix you choose plus 32 characters from A–Z, a–z and 0–9, about 190 bits, with the SHA-256 to store instead of the key.",
              },
              {
                title: "Random bytes and UUIDs",
                body: "16 to 128 bytes in hex, base64 or base64url for anything else, and version 4 UUIDs for identifiers.",
              },
            ]}
          />
        </ContentSection>

        <ContentSection eyebrow="Length" title="How long a secret key should be">
          <p>
            Length in bits is what matters, not length in characters. 128 random bits is already out of reach of any brute-force attack; 256
            bits is the usual choice because it leaves a wide margin and matches common hash sizes. For HMAC-signed JWTs it isn&apos;t a
            choice: RFC 7518 requires a key at least as long as the hash, so 32 bytes for HS256, 48 for HS384 and 64 for HS512.
          </p>
          <p className="mt-4">
            The encoding changes how many characters those bits take. 32 bytes are 64 characters in hex, 44 in base64 and 43 in base64url.
            What never works is a key a person made up: <span className={code}>supersecret2024</span> has the length of a key and the strength
            of a guess, and an HS256 secret like that can be cracked offline from a single token. The{" "}
            <AppLink href="/tools/jwt-decoder" className={linkClass}>
              JWT decoder
            </AppLink>{" "}
            can show you which algorithm a token uses.
          </p>
        </ContentSection>

        <ContentSection eyebrow="Handling" title="Keep it secret after you make it">
          <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-ink-3">
            <li>
              Put it in an environment variable or your platform&apos;s secret store. Add <span className={code}>.env</span> to{" "}
              <span className={code}>.gitignore</span> before the first commit, not after.
            </li>
            <li>Use a different key for development, staging and production, so a leaked laptop doesn&apos;t mean a leaked production.</li>
            <li>
              Rotating a key signs everyone out or invalidates what it signed, so plan for it, and rotate at once if a key lands in a repo, a
              ticket or a chat.
            </li>
            <li>
              Hand it over with something that forgets it. A message in Slack or email stays searchable for years; an{" "}
              <AppLink href="/secrets" className={linkClass}>
                EnvShare
              </AppLink>{" "}
              link is encrypted in your browser and deleted after the reads you allow.
            </li>
          </ul>
        </ContentSection>

        <ContentSection eyebrow="Privacy" title="Generated in your browser">
          <p>
            The key comes from <span className={code}>crypto.getRandomValues</span>, the browser&apos;s interface to the operating system&apos;s
            secure random generator. Characters from an alphabet are picked with rejection sampling, so none is more likely than another.
            Nothing is sent to our server: there is no request to make, the page keeps no history, and it works with the network off once
            loaded. The code is open source under the MIT license.
          </p>
        </ContentSection>

        <ContentSection eyebrow="FAQ" title="Questions">
          <Faq items={KEYS_FAQ} />
        </ContentSection>

        <ContentSection title="Related tools">
          <RelatedTools
            items={[
              { href: "/secrets", title: "EnvShare", body: "Send .env files and keys with a read limit." },
              { href: "/tools/jwt-decoder", title: "JWT decoder", body: "Read claims and verify an HS256 signature." },
              { href: "/tools/password-generator", title: "Password generator", body: "Passwords and passphrases for people." },
              { href: "/tools/encrypt-text", title: "Encrypt text", body: "Lock text into a block only a password opens." },
            ]}
          />
        </ContentSection>
      </div>
    </main>
  );
}
