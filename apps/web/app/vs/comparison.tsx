import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, CircleHelp, Minus, X } from "lucide-react";
import { buttonVariants, cn } from "@protectedshare/ui";
import AppLink from "../../components/app-link";
import JsonLd from "../../components/json-ld";
import SealMark from "../../components/seal-mark";
import { Breadcrumb } from "../../components/breadcrumb";
import { PageHeader } from "../../components/marketing";
import { COMPARISONS } from "./registry";

export type Status = "yes" | "no" | "partial" | "unknown";
export type Cell = { status: Status; note?: string };
export type ComparisonRow = { feature: string; them: Cell; us: Cell };
export type Faq = { q: string; a: string };
export type Source = { label: string; href: string };
export type Action = { href: string; label: string };
export type ToolLink = { href: string; title: string; body: string };

export const STATUS: Record<Status, { label: string; icon: typeof Check; className: string }> = {
  yes: { label: "Yes", icon: Check, className: "text-ok" },
  no: { label: "No", icon: X, className: "text-ink-3" },
  partial: { label: "Partial", icon: Minus, className: "text-warn" },
  unknown: { label: "Not stated", icon: CircleHelp, className: "text-ink-3" },
};

/** Icon + word, so the answer never depends on color alone. */
function StatusCell({ cell }: { cell: Cell }) {
  const status = STATUS[cell.status];
  const Icon = status.icon;
  return (
    <div className="flex items-start gap-2">
      <Icon aria-hidden="true" className={cn("mt-[3px] size-4 shrink-0", status.className)} strokeWidth={2.25} />
      <div className="min-w-0">
        <span className="text-small font-medium text-ink">{status.label}</span>
        {cell.note ? <span className="mt-0.5 block text-meta text-ink-3">{cell.note}</span> : null}
      </div>
    </div>
  );
}

/** ProtectedShare's tools, described the same way on every comparison. */
export const TOOLS = {
  notes: {
    href: "/notes",
    title: "Secure Notes",
    body: "A note encrypted in your browser. Burns after one read by default; add a password to send separately.",
  },
  secrets: {
    href: "/secrets",
    title: "EnvShare",
    body: ".env files, API keys and passwords, deleted after 1 to 100 reads or at expiry.",
  },
  files: {
    href: "/files",
    title: "File drop",
    body: "Files up to 25 MB, encrypted in your browser and deleted after 1 to 100 downloads.",
  },
  request: {
    href: "/request",
    title: "Secret request",
    body: "Send someone a link. What they type back is encrypted to a key only your browser holds.",
  },
} satisfies Record<string, ToolLink>;

const DEFAULT_ACTIONS: Action[] = [
  { href: "/notes", label: "Create a secure note" },
  { href: "/secrets", label: "Share a .env file" },
];

const DEFAULT_TOOLS: ToolLink[] = [TOOLS.notes, TOOLS.secrets, TOOLS.files, TOOLS.request];

const inlineLink = "font-medium text-ink underline decoration-line-strong underline-offset-[3px] hover:decoration-ink";

export default function ComparisonPage({
  slug,
  competitor,
  competitorLabel,
  title,
  lead,
  actions = DEFAULT_ACTIONS,
  rows,
  sources,
  sourcesNote,
  differences,
  whenThemTitle,
  whenThem,
  tools = DEFAULT_TOOLS,
  faqs,
}: {
  slug: string;
  competitor: string;
  /** Column header, when it should say more than the name (e.g. a discontinued product). */
  competitorLabel?: string;
  title: ReactNode;
  lead: ReactNode;
  /** Header buttons: the first is primary. */
  actions?: Action[];
  rows: ComparisonRow[];
  /** Where the competitor column comes from. */
  sources: Source[];
  /** Replaces the default "reflects their public docs" sentence before the source list. */
  sourcesNote?: ReactNode;
  differences: { title: string; body: ReactNode }[];
  whenThemTitle?: string;
  /** Honest cases where the other tool is the better pick. */
  whenThem: ReactNode[];
  /** ProtectedShare tools this page talks about. */
  tools?: ToolLink[];
  faqs: Faq[];
}) {
  const columnLabel = competitorLabel ?? competitor;

  return (
    <main className="w-full">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: { "@type": "Answer", text: faq.a },
          })),
        }}
      />

      <Breadcrumb
        items={[
          { name: "Home", path: "/" },
          { name: "Comparisons", path: "/vs" },
          { name: `${competitor} alternative`, path: `/vs/${slug}` },
        ]}
      />

      <PageHeader eyebrow="Compare" title={title} lead={lead}>
        {actions.map((action, index) => (
          <AppLink
            key={action.href}
            href={action.href}
            className={buttonVariants({ variant: index === 0 ? "primary" : "secondary" })}
          >
            {action.label}
          </AppLink>
        ))}
      </PageHeader>

      <section aria-labelledby="table-heading" className="mt-12">
        <h2 id="table-heading" className="sr-only">
          Feature comparison
        </h2>
        <div className="overflow-hidden rounded-panel border border-line bg-surface">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">
              {columnLabel} and ProtectedShare, feature by feature. Each answer is Yes, No, Partial or Not stated.
            </caption>
            <colgroup>
              <col className="hidden sm:table-column sm:w-[34%]" />
              <col className="w-1/2 sm:w-[33%]" />
              <col className="w-1/2 sm:w-[33%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-line bg-surface-2/50">
                <th scope="col" className="hidden px-5 py-3 text-meta font-medium uppercase tracking-[0.06em] text-ink-3 sm:table-cell">
                  Feature
                </th>
                <th scope="col" className="px-4 py-3 text-small font-semibold text-ink sm:px-5">
                  {columnLabel}
                </th>
                <th scope="col" className="px-4 py-3 text-small font-semibold text-ink sm:px-5">
                  <span className="inline-flex items-center gap-1.5">
                    <SealMark size={16} />
                    ProtectedShare
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <FeatureRows key={row.feature} row={row} />
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-[720px] text-meta text-ink-3">
          {sourcesNote ?? (
            <>
              The {competitor} column reflects their public docs and site at time of writing (October 2026). Products
              change, so check theirs before deciding.
            </>
          )}{" "}
          Sources:{" "}
          {sources.map((source, index) => (
            <span key={source.href}>
              {index > 0 ? ", " : null}
              <a href={source.href} rel="nofollow noopener" className="underline decoration-line-strong underline-offset-2 hover:text-ink">
                {source.label}
              </a>
            </span>
          ))}
          .
        </p>
      </section>

      <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
        <div className="flex max-w-[680px] flex-col gap-10">
          {differences.map((difference) => (
            <section key={difference.title}>
              <h2 className="text-[22px] font-semibold leading-[28px] tracking-[-0.02em] text-ink">{difference.title}</h2>
              <div
                className={cn(
                  "mt-3 flex flex-col gap-4 text-prose text-ink-2",
                  "[&_code]:rounded-[5px] [&_code]:bg-surface-2 [&_code]:px-[5px] [&_code]:py-px [&_code]:font-mono [&_code]:text-[0.875em] [&_code]:text-ink",
                  "[&_a]:font-medium [&_a]:text-ink [&_a]:underline [&_a]:decoration-line-strong [&_a]:underline-offset-[3px] hover:[&_a]:decoration-ink"
                )}
              >
                {difference.body}
              </div>
            </section>
          ))}
        </div>

        <aside className="lg:pt-1.5">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
            {whenThemTitle ?? `When ${competitor} may suit you better`}
          </h2>
          <ul className="mt-3 flex flex-col gap-2.5 border-l border-line pl-4 [&_a]:font-medium [&_a]:text-ink [&_a]:underline [&_a]:decoration-line-strong [&_a]:underline-offset-2 hover:[&_a]:decoration-ink">
            {whenThem.map((item, index) => (
              <li key={index} className="text-small text-ink-2">
                {item}
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <section aria-labelledby="tools-heading" className="mt-16 max-w-[900px]">
        <h2 id="tools-heading" className="text-[22px] font-semibold leading-[28px] tracking-[-0.02em] text-ink">
          Try it on ProtectedShare
        </h2>
        <p className="mt-2 max-w-[680px] text-ui text-ink-2">
          Free, with no account. Each tool encrypts in your browser before anything is uploaded. The{" "}
          <Link href="/security" className={inlineLink}>
            security model
          </Link>{" "}
          lists exactly what the server stores.
        </p>
        <ul className="mt-5 grid gap-x-10 gap-y-1 sm:grid-cols-2">
          {tools.map((tool) => (
            <li key={tool.href}>
              <AppLink
                href={tool.href}
                className="group -mx-3 flex items-start justify-between gap-4 rounded-field px-3 py-3 outline-none transition-colors hover:bg-ink/[0.04] focus-visible:ring-2 focus-visible:ring-seal/45"
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
      </section>

      <section aria-labelledby="faq-heading" className="mt-16 max-w-[760px]">
        <h2 id="faq-heading" className="text-[22px] font-semibold leading-[28px] tracking-[-0.02em] text-ink">
          Questions
        </h2>
        <div className="mt-4 divide-y divide-line border-y border-line">
          {faqs.map((faq) => (
            <details key={faq.q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-medium text-ink [&::-webkit-details-marker]:hidden">
                {faq.q}
                <ChevronDown
                  aria-hidden="true"
                  className="size-4 shrink-0 text-ink-3 transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <p className="pb-5 pr-8 text-ui text-ink-2">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <nav aria-label="Other comparisons" className="mt-14 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-6 text-small text-ink-3">
        <span className="font-medium text-ink-2">Other comparisons</span>
        {COMPARISONS.filter((item) => item.slug !== slug).map((item) => (
          <Link key={item.slug} href={`/vs/${item.slug}`} className="transition-colors hover:text-ink">
            vs {item.name}
          </Link>
        ))}
        <Link href="/vs" className="transition-colors hover:text-ink">
          All comparisons
        </Link>
        <Link href="/security" className="transition-colors hover:text-ink">
          Security model
        </Link>
      </nav>
    </main>
  );
}

function FeatureRows({ row }: { row: ComparisonRow }) {
  return (
    <>
      {/* On phones the feature name gets its own row so both answers keep a readable width. */}
      <tr className="sm:hidden">
        <th scope="colgroup" colSpan={2} className="px-4 pb-1 pt-3.5 text-small font-semibold text-ink">
          {row.feature}
        </th>
      </tr>
      <tr className="border-b border-line last:border-b-0">
        <th scope="row" className="hidden px-5 py-3.5 align-top text-small font-medium text-ink sm:table-cell">
          {row.feature}
        </th>
        <td className="px-4 pb-3.5 pt-1.5 align-top sm:px-5 sm:py-3.5">
          <StatusCell cell={row.them} />
        </td>
        <td className="px-4 pb-3.5 pt-1.5 align-top sm:px-5 sm:py-3.5">
          <StatusCell cell={row.us} />
        </td>
      </tr>
    </>
  );
}

/** ProtectedShare's own answers, shared by every comparison so they stay consistent. */
export const PS = {
  browserCrypto: { status: "yes", note: "AES-256-GCM via Web Crypto, before upload" },
  burn: { status: "yes", note: "Notes can burn after the first read" },
  expiry: { status: "yes", note: "1 hour to 30 days" },
  readCount: { status: "yes", note: "EnvShare: 1 to 100 reads" },
  separatePassword: { status: "yes", note: "Or keep the key in the link" },
  receipts: { status: "partial", note: "Opened status and revoke in My links, on the device that made the link" },
  files: { status: "yes", note: "Up to 25 MB, with a download limit" },
  request: { status: "yes", note: "Encrypted to your public key" },
  openSource: { status: "yes", note: "MIT license" },
  selfHost: { status: "yes", note: "Cloudflare Worker + D1, Docker web image" },
  noAccount: { status: "yes" },
} satisfies Record<string, Cell>;
