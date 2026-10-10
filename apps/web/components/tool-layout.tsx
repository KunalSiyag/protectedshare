import type { ReactNode } from "react";
import { cn } from "@protectedshare/ui";

export type ToolLayoutProps = {
  /** Small uppercase label above the title, e.g. "Share". */
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Row under the description: chips, a "How it works" link. */
  meta?: ReactNode;
  /** Right side of the title block (e.g. a secondary button). */
  actions?: ReactNode;
  /** Right column on lg (380px, sticky): ServerView + ToolNotes. Stacks under the main column on mobile. */
  aside?: ReactNode;
  /** Main column: the composer panel. */
  children: ReactNode;
  /** Renders as <main> by default. Use "div" if the page already has a <main>. */
  as?: "main" | "div";
  className?: string;
};

/**
 * Standard tool page: title block, then composer + sticky server view on large screens.
 * Lives inside the app frame (which provides max width and gutters).
 */
export default function ToolLayout({
  eyebrow,
  title,
  description,
  meta,
  actions,
  aside,
  children,
  as: Root = "main",
  className,
}: ToolLayoutProps) {
  return (
    <Root className={cn("w-full", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-[680px]">
          {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
          <h1 className="text-[32px] font-semibold leading-[36px] tracking-[-0.035em] text-ink sm:text-h1">{title}</h1>
          {description ? <p className="mt-3 text-[16px] leading-[25px] text-ink-2 sm:text-lead">{description}</p> : null}
          {meta ? <div className="mt-4 flex flex-wrap items-center gap-2">{meta}</div> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>

      <div
        className={cn(
          "mt-8 grid gap-6 md:mt-10",
          aside ? "lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8" : "max-w-[820px]"
        )}
      >
        <div className="min-w-0">{children}</div>
        {aside ? <aside className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-[84px] lg:self-start">{aside}</aside> : null}
      </div>
    </Root>
  );
}

export type ToolNotesProps = {
  title?: string;
  items: ReactNode[];
  className?: string;
};

/** Short plain-language notes under the server view. Not a card: a hairline and a list. */
export function ToolNotes({ title = "Good to know", items, className }: ToolNotesProps) {
  return (
    <div className={cn("px-1", className)}>
      <h2 className="eyebrow !text-[11px]">{title}</h2>
      <ul className="mt-3 flex flex-col gap-2.5">
        {items.map((item, index) => (
          <li key={index} className="flex gap-2.5 text-small text-ink-2">
            <span aria-hidden="true" className="mt-[7px] size-1 shrink-0 rounded-full bg-ink-3/70" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
