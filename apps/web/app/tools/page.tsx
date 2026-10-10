import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Binary, LockKeyhole } from "lucide-react";
import JsonLd from "../../components/json-ld";
import { breadcrumbJsonLd, itemListJsonLd, pageMetadata } from "../../lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Free Security Tools",
  description:
    "Free tools that run in your browser: a strong password and passphrase generator, and offline text encryption with a password. Nothing is sent to a server.",
  path: "/tools",
  keywords: ["free security tools", "password generator", "encrypt text online", "passphrase generator"],
});

const TOOLS = [
  {
    href: "/tools/password-generator",
    title: "Password generator",
    body: "Passwords, passphrases and PINs from your browser's secure random source, with entropy and an honest crack-time estimate. Includes a local strength checker.",
    icon: LockKeyhole,
  },
  {
    href: "/tools/encrypt-text",
    title: "Encrypt text",
    body: "Turn text into a block you can paste into email, chat or a file. Only the password opens it. Works with no connection once the page has loaded.",
    icon: Binary,
  },
];

export default function ToolsPage() {
  return (
    <main className="w-full">
      <JsonLd data={itemListJsonLd(TOOLS.map((tool) => ({ name: tool.title, path: tool.href })))} />
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
          No account, nothing uploaded. They use the same Web Crypto code as the rest of ProtectedShare.
        </p>
      </div>

      <ul className="mt-10 divide-y divide-line border-y border-line">
        {TOOLS.map((tool) => (
          <li key={tool.href}>
            <Link
              href={tool.href}
              className="group -mx-3 flex items-start gap-4 rounded-field px-3 py-6 outline-none transition-colors hover:bg-ink/[0.03] focus-visible:ring-2 focus-visible:ring-seal/45 sm:gap-6"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-field border border-line bg-surface text-ink-2">
                <tool.icon aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[17px] font-semibold tracking-[-0.01em] text-ink">{tool.title}</span>
                <span className="mt-1 block max-w-[62ch] text-[15px] leading-6 text-ink-2">{tool.body}</span>
              </span>
              <ArrowRight
                aria-hidden="true"
                className="mt-2.5 size-4 shrink-0 text-ink-3 transition-transform duration-150 ease-seal group-hover:translate-x-0.5 group-hover:text-ink"
              />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
