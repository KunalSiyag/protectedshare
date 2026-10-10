import type { Metadata } from "next";
import { Link2Off } from "lucide-react";
import { buttonVariants } from "@protectedshare/ui";
import AppLink from "../components/app-link";
import { PRODUCT_GROUPS } from "../lib/site-nav";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  const tools = PRODUCT_GROUPS.flatMap((group) => group.items).slice(0, 6);

  return (
    <main className="mx-auto w-full max-w-[640px] py-6 sm:py-12">
      <span className="flex size-11 items-center justify-center rounded-[12px] border border-line bg-surface text-ink-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
        <Link2Off aria-hidden="true" className="size-5" strokeWidth={1.75} />
      </span>
      <p className="eyebrow mt-6">404</p>
      <h1 className="mt-2 text-[32px] font-semibold leading-[36px] tracking-[-0.035em] text-ink sm:text-h1">
        This link is gone or never existed
      </h1>
      <div className="mt-4 flex flex-col gap-3 text-prose text-ink-2">
        <p>
          If someone sent you a secret, it may already have been opened, used up its reads, expired, or been revoked by
          the sender. When that happens the encrypted copy is deleted for good. Nobody can bring it back, including us.
        </p>
        <p>Ask the sender for a new link. If you typed the address, check it for typos.</p>
      </div>

      <div className="mt-7 flex flex-wrap gap-2">
        <AppLink href="/" className={buttonVariants({ variant: "primary" })}>
          Go to the homepage
        </AppLink>
        <AppLink href="/notepad" className={buttonVariants({ variant: "secondary" })}>
          Open the notepad
        </AppLink>
      </div>

      <section aria-labelledby="nf-tools" className="mt-14 border-t border-line pt-6">
        <h2 id="nf-tools" className="eyebrow">
          Or start something new
        </h2>
        <ul className="mt-3 grid gap-x-8 sm:grid-cols-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <li key={tool.href} className="border-b border-line">
                <AppLink
                  href={tool.href}
                  className="group flex items-start gap-3 py-3 transition-colors duration-150"
                >
                  <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ink-3 group-hover:text-ink" strokeWidth={1.75} />
                  <span className="min-w-0">
                    <span className="block text-small font-medium text-ink">{tool.label}</span>
                    <span className="mt-0.5 block text-meta text-ink-3">{tool.description}</span>
                  </span>
                </AppLink>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
