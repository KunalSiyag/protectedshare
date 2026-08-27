import Link from "next/link";
import type { ComponentProps } from "react";

const HEAVY_TOOL_PREFIXES = ["/notes", "/secrets", "/notepad", "/chat"] as const;

function isHeavyToolHref(href: ComponentProps<typeof Link>["href"]): boolean {
  const path = typeof href === "string" ? href : href.pathname ?? "";
  return HEAVY_TOOL_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

/** Next.js Link that skips viewport prefetch of crypto-heavy tool routes. */
export default function AppLink(props: ComponentProps<typeof Link>) {
  const prefetch = props.prefetch ?? (isHeavyToolHref(props.href) ? false : undefined);
  return <Link {...props} prefetch={prefetch} />;
}
