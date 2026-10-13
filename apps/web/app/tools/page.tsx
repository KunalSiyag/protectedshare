import type { Metadata } from "next";
import AppLink from "../../components/app-link";
import { ArrowRight } from "lucide-react";
import JsonLd from "../../components/json-ld";
import { FREE_TOOLS, type NavProduct } from "../../lib/site-nav";
import { breadcrumbJsonLd, itemListJsonLd, pageMetadata } from "../../lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Free Security Tools",
  description:
    "Free tools that run in your browser: password generator and strength checker, breach check, secret keys, JWT decoder, WiFi QR codes, text encryption.",
  path: "/tools",
  keywords: [
    "free security tools",
    "password generator",
    "password strength checker",
    "breached password checker",
    "secret key generator",
    "jwt decoder",
    "wifi qr code generator",
    "encrypt text online",
  ],
});

/** What each tool does, and the honest answer to "what does it send?". */
const DETAILS: Record<string, { body: string; network: string }> = {
  "/tools/password-generator": {
    body: "Passwords, passphrases and PINs from your browser's secure random source, with exact entropy and an honest crack-time estimate.",
    network: "Sends nothing",
  },
  "/tools/password-strength-checker": {
    body: "How guessable a password is, why, and how long it would last offline and online. Shows where every bit comes from.",
    network: "Sends nothing",
  },
  "/tools/breached-password-checker": {
    body: "Checks a password against Have I Been Pwned's breach list. Only the first five characters of its SHA-1 hash leave your browser.",
    network: "Sends 5 hash characters",
  },
  "/tools/secret-key-generator": {
    body: "Random keys in hex or base64, UUIDs, and the exact formats for JWT secrets, Django, Rails, Auth.js and API keys, with a .env line.",
    network: "Sends nothing",
  },
  "/tools/jwt-decoder": {
    body: "Reads a JSON Web Token's header and claims, shows when it expires in plain words, flags risky headers and checks HMAC signatures.",
    network: "Sends nothing",
  },
  "/tools/wifi-qr-code-generator": {
    body: "A QR code your guests scan to join your network, as a PNG, an SVG or a printable card. The password never leaves the page.",
    network: "Sends nothing",
  },
  "/tools/encrypt-text": {
    body: "Turn text into a block you can paste into email, chat or a file. Only the password opens it, and it decrypts offline.",
    network: "Sends nothing",
  },
};

const GROUPS: { label: string; hrefs: string[] }[] = [
  {
    label: "Passwords",
    hrefs: ["/tools/password-generator", "/tools/password-strength-checker", "/tools/breached-password-checker"],
  },
  { label: "For developers", hrefs: ["/tools/secret-key-generator", "/tools/jwt-decoder"] },
  { label: "Sharing", hrefs: ["/tools/wifi-qr-code-generator", "/tools/encrypt-text"] },
];

function toolsFor(hrefs: string[]): NavProduct[] {
  return hrefs.map((href) => FREE_TOOLS.find((tool) => tool.href === href)).filter((tool): tool is NavProduct => Boolean(tool));
}

export default function ToolsPage() {
  const ordered = GROUPS.flatMap((group) => toolsFor(group.hrefs));

  return (
    <main className="w-full">
      <JsonLd data={itemListJsonLd(ordered.map((tool) => ({ name: tool.label, path: tool.href })))} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Free tools", path: "/tools" },
        ])}
      />
      <div className="max-w-[680px]">
        <p className="eyebrow mb-3">Free tools</p>
        <h1 className="text-[32px] font-semibold leading-[36px] tracking-[-0.035em] text-ink sm:text-h1">Small tools, run in your browser</h1>
        <p className="mt-3 text-[16px] leading-[25px] text-ink-2 sm:text-lead">
          No account and no upload. Six of the seven send nothing at all; the breach checker sends five characters of a hash, and says so.
        </p>
      </div>

      {GROUPS.map((group) => (
        <section key={group.label} aria-labelledby={`tools-${group.label}`} className="mt-10">
          <h2 id={`tools-${group.label}`} className="eyebrow">
            {group.label}
          </h2>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {toolsFor(group.hrefs).map((tool) => {
              const detail = DETAILS[tool.href];
              return (
                <li key={tool.href}>
                  <AppLink
                    href={tool.href}
                    className="group -mx-3 flex items-start gap-4 rounded-field px-3 py-6 outline-none transition-colors hover:bg-ink/[0.03] focus-visible:ring-2 focus-visible:ring-seal/45 sm:gap-6"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-field border border-line bg-surface text-ink-2">
                      <tool.icon aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="text-[17px] font-semibold tracking-[-0.01em] text-ink">{tool.label}</span>
                        <span className="text-meta text-ink-3">{detail?.network}</span>
                      </span>
                      <span className="mt-1 block max-w-[62ch] text-[15px] leading-6 text-ink-2">{detail?.body ?? tool.description}</span>
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      className="mt-2.5 size-4 shrink-0 text-ink-3 transition-transform duration-150 ease-seal group-hover:translate-x-0.5 group-hover:text-ink"
                    />
                  </AppLink>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </main>
  );
}
