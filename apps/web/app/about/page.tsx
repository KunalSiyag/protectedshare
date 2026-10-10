import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@protectedshare/ui";
import AppLink from "../../components/app-link";
import { PageHeader, RailSection } from "../../components/marketing";
import { PRODUCT_GROUPS } from "../../lib/site-nav";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "About",
  description:
    "What ProtectedShare is for: handing off an encrypted note, .env file, file or one-time secret without an account. Open source, MIT licensed.",
  path: "/about",
});

const GITHUB_URL = "https://github.com/KunalSiyag/protectedshare";

const linkClass = "font-medium text-ink underline decoration-line-strong underline-offset-[3px] hover:decoration-ink";

function Paragraphs({ children }: { children: ReactNode }) {
  return <div className="flex max-w-[640px] flex-col gap-4 text-prose text-ink-2">{children}</div>;
}

export default function AboutPage() {
  const tools = PRODUCT_GROUPS.flatMap((group) => group.items);

  return (
    <main className="w-full">
      <PageHeader
        eyebrow="About"
        title="A safer way to hand someone a secret"
        lead="ProtectedShare exists for one moment: you have a password, a key or a file someone else needs, and pasting it into chat feels wrong. You shouldn't need an account to do better."
      >
        <AppLink href="/notes" className={buttonVariants({ variant: "primary" })}>
          Create a secure note
        </AppLink>
        <a href={GITHUB_URL} className={buttonVariants({ variant: "secondary" })}>
          Read the source
        </a>
      </PageHeader>

      <div className="mt-14">
        <RailSection title="Why it exists">
          <Paragraphs>
            <p>
              Secrets get shared the easy way: a database password in a team chat, an API key in an email, a Wi-Fi
              password in a group text. Those messages stay in histories, backups and notification previews long after
              anyone needs them.
            </p>
            <p>
              ProtectedShare makes the careful way about as quick. Your browser encrypts the secret, the server holds only
              ciphertext, and the link stops working after it&apos;s read or when it expires. Nobody signs up for
              anything.
            </p>
          </Paragraphs>
        </RailSection>

        <RailSection title="What's in it" description="Every tool keeps plaintext in the browser.">
          <ul className="divide-y divide-line border-y border-line">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <li key={tool.href}>
                  <AppLink
                    href={tool.href}
                    className="group flex items-center gap-3.5 py-3 transition-colors duration-150 hover:text-ink"
                  >
                    <Icon aria-hidden="true" className="size-4 shrink-0 text-ink-3" strokeWidth={1.75} />
                    <span className="w-[116px] shrink-0 text-small font-medium text-ink sm:w-[150px]">{tool.label}</span>
                    <span className="min-w-0 flex-1 text-small text-ink-3">{tool.description}</span>
                    <ArrowRight
                      aria-hidden="true"
                      className="hidden size-3.5 shrink-0 text-ink-3 transition-transform duration-150 group-hover:translate-x-0.5 sm:block"
                    />
                  </AppLink>
                </li>
              );
            })}
          </ul>
        </RailSection>

        <RailSection title="Who it's for">
          <Paragraphs>
            <p>
              People who need to get one secret to one person: a freelancer sending client credentials, a developer
              handing over a <code className="rounded-[5px] bg-surface-2 px-[5px] py-px font-mono text-[0.875em] text-ink">.env</code>{" "}
              file, someone asking a colleague to send them a password without it landing in chat.
            </p>
            <p>
              It isn&apos;t a password manager and it isn&apos;t a replacement for your team&apos;s messenger. It&apos;s
              the courier between them: small, temporary handoffs that should leave nothing readable behind.
            </p>
          </Paragraphs>
        </RailSection>

        <RailSection title="How it keeps its promise">
          <Paragraphs>
            <p>
              Encryption is AES-256-GCM in your browser, through the Web Crypto API. Keys ride in the part of the link
              after <code className="rounded-[5px] bg-surface-2 px-[5px] py-px font-mono text-[0.875em] text-ink">#</code>, which
              browsers don&apos;t send to servers. The server stores ciphertext and a hash it can check before handing
              that ciphertext out, so it can enforce read limits without being able to read anything.
            </p>
            <p>
              That isn&apos;t magic. Our host still sees IP addresses, and the server knows sizes, counts and times. The{" "}
              <AppLink href="/security" className={linkClass}>
                security model
              </AppLink>{" "}
              and{" "}
              <AppLink href="/privacy" className={linkClass}>
                privacy page
              </AppLink>{" "}
              spell out exactly what it can and can&apos;t see.
            </p>
          </Paragraphs>
        </RailSection>

        <RailSection title="Open source">
          <Paragraphs>
            <p>
              All of it, the web app, the API and the crypto package, is public on{" "}
              <a href={GITHUB_URL} className={linkClass}>
                GitHub
              </a>{" "}
              under the MIT license. Read it, file issues, or{" "}
              <AppLink href="/self-host" className={linkClass}>
                run your own copy
              </AppLink>
              . No independent audit has been published; the code being open is how you can check our claims today.
            </p>
            <p>
              ProtectedShare is maintained by Kunal Siyag. The hosted tools are free and show no ads. If you need a
              dedicated instance or just want to say something,{" "}
              <AppLink href="/contact" className={linkClass}>
                get in touch
              </AppLink>
              .
            </p>
          </Paragraphs>
        </RailSection>
      </div>
    </main>
  );
}
