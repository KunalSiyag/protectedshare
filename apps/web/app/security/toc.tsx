"use client";

import { useEffect, useState } from "react";
import { cn } from "@protectedshare/ui";

export type TocItem = { id: string; label: string };

/** Sticky contents list. The section nearest the top of the viewport gets the seal indicator. */
export default function Toc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => Boolean(node));
    if (sections.length === 0) return;

    const onScroll = () => {
      const line = 120;
      let current = sections[0].id;
      for (const section of sections) {
        if (section.getBoundingClientRect().top - line <= 0) current = section.id;
      }
      // At the very bottom, the last short sections can't reach the line.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        current = sections[sections.length - 1].id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [items]);

  return (
    <nav aria-label="On this page">
      <p className="eyebrow !text-[11px]">On this page</p>
      <ol className="mt-3 border-l border-line">
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "-ml-px block border-l py-1.5 pl-3.5 text-small outline-none transition-colors duration-150 ease-seal focus-visible:ring-2 focus-visible:ring-seal/45",
                  isActive ? "border-seal font-medium text-ink" : "border-transparent text-ink-3 hover:text-ink"
                )}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
