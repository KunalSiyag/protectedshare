import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ArrowRight, ArrowUpRight, Container, Lock, ShieldCheck } from "lucide-react";
import { buttonVariants, cn } from "@protectedshare/ui";
import AppLink from "../components/app-link";
import JsonLd from "../components/json-ld";
import HowItWorks from "../components/home/how-it-works";
import QuickShare from "../components/home/quick-share";
import ToolIndex from "../components/home/tool-index";
import WhatWeStore from "../components/home/what-we-store";
import { HOME_FAQS } from "../lib/home-faq";
import { DEFAULT_DESCRIPTION, SITE_URL, faqPageJsonLd, webApplicationJsonLd } from "../lib/seo";

const TITLE = "Zero-Knowledge Secret Sharing | ProtectedShare";
const GITHUB_URL = "https://github.com/KunalSiyag/protectedshare";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DEFAULT_DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ProtectedShare: encrypted links for passwords, .env files, notes and files",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ["/og-image.jpg"],
  },
};

const COMPARISONS = [
  { href: "/vs/privnote", name: "Privnote", line: "One-time notes, side by side." },
  { href: "/vs/onetimesecret", name: "OneTimeSecret", line: "Expiring secrets and passphrases." },
  { href: "/vs/envshare", name: "EnvShare", line: ".env sharing with read limits." },
  { href: "/vs/protectedtext", name: "ProtectedText", line: "Encrypted notepads compared." },
];

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className} fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

function SectionHeading({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id} className="mt-3 text-[28px] font-semibold leading-[34px] tracking-[-0.03em] text-ink sm:text-[34px] sm:leading-[40px]">
        {title}
      </h2>
      {children ? <div className="mt-3 max-w-[56ch] text-prose text-ink-2">{children}</div> : null}
    </div>
  );
}

function Band({ labelledBy, children, className }: { labelledBy: string; children: ReactNode; className?: string }) {
  return (
    <section aria-labelledby={labelledBy} className={cn("border-t border-line", className)}>
      <div className="mx-auto w-full max-w-content px-4 py-16 sm:px-6 lg:py-24">{children}</div>
    </section>
  );
}

function HeroIntro() {
  return (
    <>
      <p className="eyebrow">Encrypted links for passwords, keys, notes and files</p>
      <h1
        id="hero-title"
        className="display mt-4 max-w-[13ch] text-[42px] sm:text-[54px] lg:text-[clamp(3rem,4.4vw,3.75rem)]"
      >
        Send a secret our server can&apos;t read.
      </h1>
      <p className="mt-5 max-w-[50ch] text-[17px] leading-[27px] text-ink-2 sm:text-lead">
        It&apos;s encrypted in this tab. The key rides in the part of the link after&nbsp;<span className="font-mono text-[0.92em] text-ink">#</span>, which browsers never send to a server.
      </p>
    </>
  );
}

export default function HomePage() {
  return (
    <main className="w-full">
      <JsonLd data={webApplicationJsonLd()} />
      <JsonLd data={faqPageJsonLd(HOME_FAQS)} />

      <section aria-labelledby="hero-title" className="relative">
        <QuickShare intro={<HeroIntro />} />
      </section>

      <Band labelledBy="tools-title">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
          <SectionHeading id="tools-title" eyebrow="Eight tools" title="Pick the right tool." />
          <p className="max-w-[52ch] text-prose text-ink-2 lg:justify-self-end">
            Each one does a single job, and all of them encrypt in your browser before anything is sent. The limits
            listed are the ones the code enforces.
          </p>
        </div>
        <div className="mt-10">
          <ToolIndex />
        </div>
      </Band>

      <Band labelledBy="how-title">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
          <SectionHeading id="how-title" eyebrow="How it works" title="Two paths. We only see one of them." />
          <p className="max-w-[52ch] text-prose text-ink-2 lg:justify-self-end">
            The ciphertext goes through our server. The key goes around it, inside the link you send yourself.
            Neither half is any use without the other.
          </p>
        </div>
        <div className="mt-12">
          <HowItWorks />
        </div>
      </Band>

      <Band labelledBy="store-title" className="bg-surface-2/40">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
          <SectionHeading id="store-title" eyebrow="No fine print" title="What we store, exactly." />
          <p className="max-w-[52ch] text-prose text-ink-2 lg:justify-self-end">
            Tool by tool, with nothing rounded off. If it isn&apos;t listed under &ldquo;stored on our server&rdquo;, it isn&apos;t there.{" "}
            <AppLink href="/security" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
              Read the full security model
            </AppLink>
            .
          </p>
        </div>
        <div className="mt-10">
          <WhatWeStore />
        </div>
      </Band>

      <Band labelledBy="source-title">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-20">
          <div className="min-w-0">
            <SectionHeading id="source-title" eyebrow="Open source" title="Read the code. Or run your own.">
              <p>
                A security tool you can&apos;t inspect is a promise. This one is MIT licensed: the API is a Cloudflare
                Worker with a D1 database, the web app is Next.js. Run both on your own account and nothing touches ours.
              </p>
            </SectionHeading>
            <div className="mt-7 overflow-hidden rounded-panel border border-line bg-surface">
              <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
                <span className="flex items-center gap-2 text-meta font-medium text-ink-3">
                  <Container aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
                  Web app image
                </span>
                <span className="font-mono text-[11px] text-ink-3">ghcr.io</span>
              </div>
              <pre className="overflow-x-auto px-4 py-3.5 font-mono text-[12.5px] leading-[20px] text-ink">
                <span className="select-none text-ink-3">$ </span>docker pull ghcr.io/kunalsiyag/protectedshare-web:latest
              </pre>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <a href={GITHUB_URL} className={buttonVariants({ variant: "secondary" })}>
                <GitHubMark className="size-4" />
                Source on GitHub
              </a>
              <AppLink href="/self-host" className={buttonVariants({ variant: "ghost" })}>
                Self-hosting guide
                <ArrowRight aria-hidden="true" />
              </AppLink>
            </div>
          </div>

          <div className="min-w-0">
            <h3 className="text-[17px] font-semibold tracking-[-0.015em] text-ink">Coming from somewhere else?</h3>
            <p className="mt-1.5 text-ui text-ink-3">Feature-by-feature notes, written from public docs. Not audits.</p>
            <ul className="mt-5 border-t border-line">
              {COMPARISONS.map((item) => (
                <li key={item.href} className="border-b border-line">
                  <AppLink
                    href={item.href}
                    className="group -mx-3 flex items-center justify-between gap-4 rounded-control px-3 py-3.5 outline-none transition-colors hover:bg-ink/[0.035] focus-visible:ring-2 focus-visible:ring-seal/45"
                  >
                    <span className="min-w-0">
                      <span className="block text-ui font-medium text-ink">ProtectedShare vs {item.name}</span>
                      <span className="block text-small text-ink-3">{item.line}</span>
                    </span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-4 shrink-0 text-ink-3 transition-transform duration-150 ease-seal group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
                    />
                  </AppLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Band>

      <Band labelledBy="faq-title">
        <div className="grid gap-10 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-16">
          <div className="lg:sticky lg:top-[96px] lg:self-start">
            <SectionHeading id="faq-title" eyebrow="Questions" title="Asked before you trust it.">
              <p>
                Something missing? Write to{" "}
                <a href="mailto:admin@protectedshare.me" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                  admin@protectedshare.me
                </a>
                .
              </p>
            </SectionHeading>
          </div>
          <div className="min-w-0 border-t border-line">
            {HOME_FAQS.map((item) => (
              <details key={item.question} className="group border-b border-line">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 rounded-control py-4 text-[16px] font-medium leading-[24px] text-ink outline-none focus-visible:ring-2 focus-visible:ring-seal/45 [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <span
                    aria-hidden="true"
                    className="relative mt-1 size-4 shrink-0 text-ink-3 before:absolute before:left-0 before:top-1/2 before:h-px before:w-4 before:bg-current after:absolute after:left-1/2 after:top-0 after:h-4 after:w-px after:bg-current after:transition-transform after:duration-150 group-open:after:scale-y-0"
                  />
                </summary>
                <p className="max-w-[68ch] pb-5 pr-10 text-prose text-ink-2">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </Band>

      <section aria-labelledby="cta-title" className="border-t border-line bg-surface">
        <div className="mx-auto flex w-full max-w-content flex-col gap-8 px-4 py-16 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:py-20">
          <div className="min-w-0">
            <h2 id="cta-title" className="max-w-[20ch] text-[30px] font-semibold leading-[36px] tracking-[-0.03em] text-ink sm:text-[40px] sm:leading-[44px]">
              The next password you send doesn&apos;t have to live in a chat log.
            </h2>
            <p className="mt-3 flex items-center gap-2 text-ui text-ink-3">
              <ShieldCheck aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
              Free, no account, deleted on read.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <a href="#seal" className={buttonVariants({ size: "lg" })}>
              <Lock aria-hidden="true" />
              Seal a secret
            </a>
            <AppLink href="/security" className={buttonVariants({ variant: "secondary", size: "lg" })}>
              Security model
            </AppLink>
          </div>
        </div>
      </section>
    </main>
  );
}
