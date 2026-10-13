import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@protectedshare/ui";
import AppLink from "../../components/app-link";
import JsonLd from "../../components/json-ld";
import { Breadcrumb } from "../../components/breadcrumb";
import { PageHeader } from "../../components/marketing";
import { itemListJsonLd } from "../../lib/seo";
import { STATUS, TOOLS, type Status } from "./comparison";
import { comparisonMetadata } from "./meta";
import { COMPARISON_GROUPS, COMPARISONS } from "./registry";

export const metadata: Metadata = comparisonMetadata({
  title: "Compare Secret and File Sharing Tools",
  description:
    "ProtectedShare side by side with Privnote, Yopass, Password Pusher, Bitwarden Send, WeTransfer, PrivateBin and more, with sources linked on every page.",
  path: "/vs",
  keywords: [
    "privnote alternatives",
    "onetimesecret alternative",
    "secret sharing tools compared",
    "secure file transfer comparison",
    "one-time secret link tools",
    "encrypted pastebin alternatives",
  ],
});

const LEGEND: { status: Status; body: string }[] = [
  { status: "yes", body: "Their docs or site say it does this. The note under the answer adds limits, such as a plan or a size." },
  { status: "no", body: "Their docs describe it working differently, or the feature isn't part of the product. The note says which." },
  { status: "partial", body: "Available with a condition: on a paid plan, for recipients only, or depending on who runs the server." },
  { status: "unknown", body: "We couldn't confirm it either way in their public docs. It doesn't mean the feature is missing." },
];

const linkClass = "font-medium text-ink underline decoration-line-strong underline-offset-[3px] hover:decoration-ink";

/** A rough guide by job. Every claim about another tool comes from that tool's comparison page. */
const JOBS: { job: string; detail: ReactNode }[] = [
  {
    job: "A password, once",
    detail: (
      <>
        A <AppLink href="/notes" className={linkClass}>Secure Note</AppLink> that burns after reading, or EnvShare with
        one read. <Link href="/vs/privnote" className={linkClass}>Privnote</Link>,{" "}
        <Link href="/vs/onetimesecret" className={linkClass}>OneTimeSecret</Link>,{" "}
        <Link href="/vs/yopass" className={linkClass}>Yopass</Link> and{" "}
        <Link href="/vs/password-pusher" className={linkClass}>Password Pusher</Link> do this too; their pages show where
        each one encrypts.
      </>
    ),
  },
  {
    job: "A credential needed a few times",
    detail: (
      <>
        <AppLink href="/secrets" className={linkClass}>EnvShare</AppLink> allows 1 to 100 reads, so a teammate can copy it
        again during setup. Password Pusher also counts views. Yopass and PrivateBin offer one read, or any number until the
        link expires.
      </>
    ),
  },
  {
    job: "A file under 25 MB",
    detail: (
      <>
        The <AppLink href="/files" className={linkClass}>file drop</AppLink> encrypts it in your browser and deletes it after
        1 to 100 downloads. <Link href="/vs/bitwarden-send" className={linkClass}>Bitwarden Send</Link> does the same for
        files up to 500 MB, on a paid plan.
      </>
    ),
  },
  {
    job: "Files measured in gigabytes",
    detail: (
      <>
        ProtectedShare isn&apos;t the tool for this. <Link href="/vs/wetransfer" className={linkClass}>WeTransfer</Link>{" "}
        handles transfers this size, with 3 GB a month on its free plan.{" "}
        <Link href="/vs/firefox-send" className={linkClass}>Firefox Send</Link> used to, until Mozilla shut it down.
      </>
    ),
  },
  {
    job: "A secret someone has to send you",
    detail: (
      <>
        A <AppLink href="/request" className={linkClass}>secret request</AppLink>: they open your link, and what they type
        is encrypted to a key only your browser holds. Password Pusher has requests too, and Yopass with a business
        license.
      </>
    ),
  },
  {
    job: "Text you want to keep",
    detail: (
      <>
        <Link href="/vs/protectedtext" className={linkClass}>ProtectedText</Link> and{" "}
        <Link href="/vs/privatebin" className={linkClass}>PrivateBin</Link> keep text for much longer than a handoff
        link. ProtectedShare&apos;s <AppLink href="/notepad" className={linkClass}>encrypted notepad</AppLink> can stay in
        your browser, or sync only ciphertext.
      </>
    ),
  },
];

export default function ComparisonsIndexPage() {
  return (
    <main className="w-full">
      <JsonLd
        data={itemListJsonLd(
          COMPARISONS.map((item) => ({ name: `ProtectedShare vs ${item.name}`, path: `/vs/${item.slug}` }))
        )}
      />
      <Breadcrumb
        items={[
          { name: "Home", path: "/" },
          { name: "Comparisons", path: "/vs" },
        ]}
      />

      <PageHeader
        eyebrow="Compare"
        title="How ProtectedShare compares"
        lead="Ten tools people use to send a password, a note or a file, side by side with ProtectedShare. Every page links the sources we checked and marks anything we couldn't confirm as Not stated."
      />

      <div className="mt-12 flex flex-col gap-12">
        {COMPARISON_GROUPS.map((group) => {
          const items = COMPARISONS.filter((item) => item.group === group.id);
          return (
            <section key={group.id} aria-labelledby={`group-${group.id}`}>
              <h2 id={`group-${group.id}`} className="text-[22px] font-semibold leading-[28px] tracking-[-0.02em] text-ink">
                {group.title}
              </h2>
              <p className="mt-1.5 max-w-[680px] text-ui text-ink-3">{group.blurb}</p>
              <ul className="mt-4 divide-y divide-line border-y border-line">
                {items.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/vs/${item.slug}`}
                      className="group -mx-3 flex items-start gap-4 rounded-field px-3 py-5 outline-none transition-colors hover:bg-ink/[0.03] focus-visible:ring-2 focus-visible:ring-seal/45 sm:gap-6"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-[17px] font-semibold tracking-[-0.01em] text-ink">
                          ProtectedShare vs {item.name}
                        </span>
                        <span className="mt-1 block max-w-[68ch] text-[15px] leading-6 text-ink-2">{item.summary}</span>
                      </span>
                      <ArrowRight
                        aria-hidden="true"
                        className="mt-1.5 size-4 shrink-0 text-ink-3 transition-transform duration-150 ease-seal group-hover:translate-x-0.5 group-hover:text-ink"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <section aria-labelledby="jobs-heading" className="mt-16 max-w-[900px]">
        <h2 id="jobs-heading" className="text-[22px] font-semibold leading-[28px] tracking-[-0.02em] text-ink">
          Which tool for which job
        </h2>
        <p className="mt-2 max-w-[680px] text-ui text-ink-2">
          The right tool depends on what you&apos;re sending and how long it should last. A rough guide:
        </p>
        <dl className="mt-4 divide-y divide-line border-y border-line">
          {JOBS.map((entry) => (
            <div key={entry.job} className="grid gap-1 py-3.5 sm:grid-cols-[240px_minmax(0,1fr)] sm:gap-6">
              <dt className="text-ui font-medium text-ink">{entry.job}</dt>
              <dd className="text-[15px] leading-6 text-ink-2">{entry.detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:gap-16">
        <section aria-labelledby="method-heading" className="max-w-[680px]">
          <h2 id="method-heading" className="text-[22px] font-semibold leading-[28px] tracking-[-0.02em] text-ink">
            How we compare
          </h2>
          <p className="mt-3 text-prose text-ink-2">
            Each page puts the other product&apos;s documented features next to ProtectedShare&apos;s, row by row. Every
            answer is one of four words, with an icon so it never depends on color:
          </p>
          <dl className="mt-4 divide-y divide-line border-y border-line">
            {LEGEND.map((entry) => {
              const status = STATUS[entry.status];
              const Icon = status.icon;
              return (
                <div key={entry.status} className="grid gap-1 py-3 sm:grid-cols-[130px_minmax(0,1fr)] sm:gap-4">
                  <dt className="flex items-center gap-2 text-small font-medium text-ink">
                    <Icon aria-hidden="true" className={cn("size-4 shrink-0", status.className)} strokeWidth={2.25} />
                    {status.label}
                  </dt>
                  <dd className="text-small text-ink-2">{entry.body}</dd>
                </div>
              );
            })}
          </dl>
          <p className="mt-4 text-prose text-ink-2">
            We checked every source in October 2026 and link them under each table. Products change, so check theirs
            before deciding, and if something here is out of date, <Link href="/contact" className={linkClass}>tell us</Link>.
            Each page also says when the other tool may suit you better, because sometimes it will.
          </p>
          <p className="mt-4 text-prose text-ink-2">
            These pages are written by ProtectedShare. They are not an independent audit of anyone, us included. Our own
            column is checked against our code, and the <Link href="/security" className={linkClass}>security model</Link>{" "}
            documents what our server stores.
          </p>
        </section>

        <section aria-labelledby="ours-heading" className="max-w-[680px]">
          <h2 id="ours-heading" className="text-[22px] font-semibold leading-[28px] tracking-[-0.02em] text-ink">
            What ProtectedShare does
          </h2>
          <p className="mt-3 text-prose text-ink-2">
            Your browser encrypts with AES-256-GCM before anything is uploaded. The key stays in the link after the #,
            which browsers don&apos;t send to servers, or comes from a password you send another way. The server stores
            ciphertext and a hash it checks before releasing it. Shares last at most 30 days, and nobody needs an account.
          </p>
          <ul className="mt-4 flex flex-col gap-1">
            {[TOOLS.notes, TOOLS.secrets, TOOLS.files, TOOLS.request].map((tool) => (
              <li key={tool.href}>
                <AppLink
                  href={tool.href}
                  className="group -mx-3 flex items-start justify-between gap-4 rounded-field px-3 py-2.5 outline-none transition-colors hover:bg-ink/[0.04] focus-visible:ring-2 focus-visible:ring-seal/45"
                >
                  <span>
                    <span className="block text-ui font-medium text-ink">{tool.title}</span>
                    <span className="mt-0.5 block text-small text-ink-3">{tool.body}</span>
                  </span>
                  <ArrowRight
                    aria-hidden="true"
                    className="mt-1 size-4 shrink-0 text-ink-3 transition-transform duration-150 ease-seal group-hover:translate-x-0.5 group-hover:text-ink"
                  />
                </AppLink>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-prose text-ink-2">
            The code is open source under the MIT license, and you can run your own copy on Cloudflare Workers with the{" "}
            <Link href="/self-host" className={linkClass}>self-host guide</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
