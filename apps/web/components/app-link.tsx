import Link from "next/link";
import type { ComponentProps } from "react";

const HEAVY_TOOL_PREFIXES = ["/notes", "/secrets", "/notepad", "/chat", "/files", "/request", "/tools/encrypt-text"] as const;

function isHeavyToolHref(href: ComponentProps<typeof Link>["href"]): boolean {
  const path = typeof href === "string" ? href : href.pathname ?? "";
  return HEAVY_TOOL_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

// Routes with their own Content-Security-Policy need a full document load; a client-side
// navigation would keep the previous page's policy.
const FULL_LOAD_PATHS = ["/tools/breached-password-checker"] as const;

/** Next.js Link that skips viewport prefetch of crypto-heavy tool routes. */
export default function AppLink(props: ComponentProps<typeof Link>) {
  if (typeof props.href === "string" && FULL_LOAD_PATHS.some((path) => props.href === path)) {
    const { href, prefetch: _prefetch, replace: _replace, scroll: _scroll, shallow: _shallow, locale: _locale, legacyBehavior: _legacy, passHref: _passHref, ...anchorProps } = props;
    return <a href={href} {...anchorProps} />;
  }
  const prefetch = props.prefetch ?? (isHeavyToolHref(props.href) ? false : undefined);
  return <Link {...props} prefetch={prefetch} />;
}
