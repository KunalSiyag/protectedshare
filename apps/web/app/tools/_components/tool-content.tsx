import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";

export type FaqItem = { question: string; answer: string };

/** Article-style section under a tool: heading on the left on wide screens, prose on the right. */
export function ContentSection({ id, eyebrow, title, children }: { id?: string; eyebrow?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="grid gap-4 border-t border-line py-12 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-12 lg:py-14">
      <div>
        {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
        <h2 className="text-[22px] font-semibold leading-7 tracking-[-0.02em] text-ink text-balance">{title}</h2>
      </div>
      <div className="min-w-0 max-w-[720px] text-prose text-ink-2">{children}</div>
    </section>
  );
}

/** Short points in two columns: a title and one or two sentences each. No cards. */
export function PointList({ items }: { items: { title: string; body: ReactNode }[] }) {
  return (
    <dl className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.title}>
          <dt className="text-ui font-semibold text-ink">{item.title}</dt>
          <dd className="mt-1.5 text-[15px] leading-6 text-ink-2">{item.body}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Faq({ items }: { items: readonly FaqItem[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item) => (
        <details key={item.question} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-ui font-medium text-ink outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-seal/45 [&::-webkit-details-marker]:hidden">
            <span>{item.question}</span>
            <ChevronDown
              aria-hidden="true"
              className="size-4 shrink-0 text-ink-3 transition-transform duration-200 ease-seal group-open:rotate-180"
            />
          </summary>
          <p className="pb-5 pr-8 text-[15px] leading-6 text-ink-2">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

export function RelatedTools({ items }: { items: { href: string; title: string; body: string }[] }) {
  return (
    <ul className="grid gap-x-10 gap-y-1 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="group -mx-3 flex items-start justify-between gap-4 rounded-field px-3 py-3 outline-none transition-colors hover:bg-ink/[0.04] focus-visible:ring-2 focus-visible:ring-seal/45"
          >
            <span>
              <span className="block text-ui font-medium text-ink">{item.title}</span>
              <span className="mt-0.5 block text-small text-ink-3">{item.body}</span>
            </span>
            <ArrowRight
              aria-hidden="true"
              className="mt-1 size-4 shrink-0 text-ink-3 transition-transform duration-150 ease-seal group-hover:translate-x-0.5 group-hover:text-ink"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
