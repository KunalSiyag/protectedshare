import Link from "next/link";
import JsonLd from "./json-ld";
import { breadcrumbJsonLd } from "../lib/seo";

export function Breadcrumb({
  items,
  className = "mb-4 flex justify-center",
}: {
  items: { name: string; path: string }[];
  className?: string;
}) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(items)} />
      <nav aria-label="Breadcrumb" className={className}>
        <ol className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          {items.map((item, index) => {
            const last = index === items.length - 1;
            return (
              <li key={item.path} className="flex items-center gap-2">
                {index > 0 ? <span aria-hidden="true">/</span> : null}
                {last ? (
                  <span aria-current="page" className="text-zinc-700 dark:text-zinc-300">
                    {item.name}
                  </span>
                ) : (
                  <Link href={item.path} className="hover:text-zinc-900 dark:hover:text-zinc-100">
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
