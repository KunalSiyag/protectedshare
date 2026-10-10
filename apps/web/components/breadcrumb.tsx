import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@protectedshare/ui";
import JsonLd from "./json-ld";
import { breadcrumbJsonLd } from "../lib/seo";

/** Visible breadcrumb trail plus BreadcrumbList JSON-LD. */
export function Breadcrumb({
  items,
  className,
}: {
  items: { name: string; path: string }[];
  className?: string;
}) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(items)} />
      <nav aria-label="Breadcrumb" className={cn("mb-5", className)}>
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-small text-ink-3">
          {items.map((item, index) => {
            const last = index === items.length - 1;
            return (
              <li key={item.path} className="flex min-w-0 items-center gap-1.5">
                {index > 0 ? <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-ink-3/70" /> : null}
                {last ? (
                  <span aria-current="page" className="truncate text-ink-2">
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.path}
                    className="rounded-[4px] transition-colors duration-150 hover:text-ink"
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
