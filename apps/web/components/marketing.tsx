import type { ReactNode } from "react";
import { cn } from "@protectedshare/ui";

/**
 * Building blocks for reading pages (about, legal, self-host, blog, comparisons).
 * Sections and hairlines, not cards. Panels stay reserved for things you interact with.
 */

export function PageHeader({
  eyebrow,
  title,
  lead,
  meta,
  children,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  /** Small row under the lead: dates, chips. */
  meta?: ReactNode;
  /** Actions under the lead. */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("max-w-[720px]", className)}>
      {eyebrow ? <div className="eyebrow mb-3">{eyebrow}</div> : null}
      <h1 className="text-[32px] font-semibold leading-[36px] tracking-[-0.035em] text-ink sm:text-h1">{title}</h1>
      {lead ? <p className="mt-4 text-[16px] leading-[26px] text-ink-2 sm:text-lead">{lead}</p> : null}
      {meta ? <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-small text-ink-3">{meta}</div> : null}
      {children ? <div className="mt-6 flex flex-wrap items-center gap-2">{children}</div> : null}
    </header>
  );
}

/** Dot separator for meta rows. */
export function MetaDot() {
  return <span aria-hidden="true" className="size-[3px] rounded-full bg-ink-3/60" />;
}

/**
 * Long-form text styles. Wrap plain JSX (p, ul, ol, a, code, strong, h2, h3, table) and it
 * gets the reading rhythm: 16/26 body, ink-2, 680px measure.
 */
export const proseClassName = cn(
  "max-w-[680px] text-prose text-ink-2",
  "[&>*:first-child]:mt-0",
  "[&_p]:mt-4",
  "[&_h2]:mt-12 [&_h2]:text-[22px] [&_h2]:font-semibold [&_h2]:leading-[28px] [&_h2]:tracking-[-0.02em] [&_h2]:text-ink",
  "[&_h3]:mt-8 [&_h3]:text-[17px] [&_h3]:font-semibold [&_h3]:leading-[24px] [&_h3]:tracking-[-0.01em] [&_h3]:text-ink",
  "[&_h2+p]:mt-3 [&_h3+p]:mt-2 [&_h2+ul]:mt-3 [&_h3+ul]:mt-2",
  "[&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-5",
  "[&_li]:mt-2 [&_li]:pl-1 [&_li::marker]:text-ink-3",
  "[&_strong]:font-semibold [&_strong]:text-ink",
  "[&_a]:font-medium [&_a]:text-ink [&_a]:underline [&_a]:decoration-line-strong [&_a]:underline-offset-[3px] hover:[&_a]:decoration-ink",
  "[&_:not(pre)>code]:rounded-[5px] [&_:not(pre)>code]:bg-surface-2 [&_:not(pre)>code]:px-[5px] [&_:not(pre)>code]:py-px [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[0.875em] [&_:not(pre)>code]:text-ink"
);

export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(proseClassName, className)}>{children}</div>;
}

/** Hairline-separated section with a heading in a left rail on wide screens. */
export function RailSection({
  id,
  title,
  description,
  children,
  className,
}: {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn("grid gap-4 border-t border-line py-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12", className)}
    >
      <div>
        <h2 className="text-[17px] font-semibold leading-6 tracking-[-0.015em] text-ink">{title}</h2>
        {description ? <p className="mt-1.5 text-small text-ink-3">{description}</p> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

/** Two-column definition rows: term on the left, detail on the right. Hairlines between. */
export function DefinitionList({
  items,
  className,
  termClassName,
}: {
  items: { term: ReactNode; detail: ReactNode }[];
  className?: string;
  termClassName?: string;
}) {
  return (
    <dl className={cn("divide-y divide-line border-y border-line", className)}>
      {items.map((item, index) => (
        <div key={index} className="grid gap-1 py-3.5 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-6">
          <dt className={cn("text-small font-medium text-ink", termClassName)}>{item.term}</dt>
          <dd className="text-small text-ink-2 [&_code]:font-mono [&_code]:text-[12.5px] [&_code]:text-ink">{item.detail}</dd>
        </div>
      ))}
    </dl>
  );
}
