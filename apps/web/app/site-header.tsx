"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Link2, Plus } from "lucide-react";
import { buttonVariants, cn } from "@protectedshare/ui";
import AppLink from "../components/app-link";
import SealMark from "../components/seal-mark";
import { useMyLinksCount } from "../lib/my-links";
import { PRIMARY_LINKS, isActivePath } from "../lib/site-nav";
import ThemeToggle from "./theme-toggle";
import MobileNav from "./mobile-nav";
import ProductsMenu from "./products-menu";

export function Wordmark({ className }: { className?: string }) {
  return (
    <AppLink
      href="/"
      aria-label="ProtectedShare home"
      className={cn(
        "group flex shrink-0 items-center gap-2 rounded-control text-[15px] font-semibold tracking-[-0.02em] text-ink outline-none focus-visible:ring-2 focus-visible:ring-seal/45 focus-visible:ring-offset-4 focus-visible:ring-offset-bg",
        className
      )}
    >
      <SealMark size={22} className="transition-transform duration-300 ease-seal group-hover:-rotate-12" />
      <span>ProtectedShare</span>
    </AppLink>
  );
}

export function MyLinksLink({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const count = useMyLinksCount();
  const pathname = usePathname();
  const active = isActivePath(pathname, "/links");
  return (
    <AppLink
      href="/links"
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      aria-label={count > 0 ? `My links, ${count} active` : "My links"}
      className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5 px-2.5", active && "text-ink", className)}
    >
      <Link2 aria-hidden="true" strokeWidth={1.75} />
      My links
      {count > 0 ? (
        <span className="tabular ml-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1 text-[11px] font-semibold leading-none text-on-ink">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </AppLink>
  );
}

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 h-header border-b transition-[background-color,border-color,box-shadow] duration-200 ease-seal",
        scrolled
          ? "border-line bg-bg/[0.88] shadow-header backdrop-blur-md backdrop-saturate-150"
          : "border-transparent bg-bg"
      )}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[60] focus:rounded-control focus:bg-ink focus:px-3 focus:py-2 focus:text-small focus:text-on-ink"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-full max-w-content items-center gap-6 px-4 sm:px-6">
        <Wordmark />

        <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
          <ProductsMenu />
          {PRIMARY_LINKS.map((link) => {
            const active = isActivePath(pathname, link.href);
            return (
              <AppLink
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-8 items-center rounded-control px-2.5 text-small font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-seal/45",
                  active
                    ? "text-ink after:absolute after:inset-x-2.5 after:-bottom-[15px] after:h-[2px] after:rounded-full after:bg-seal"
                    : "text-ink-2 hover:text-ink"
                )}
              >
                {link.label}
              </AppLink>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <MyLinksLink className="hidden sm:inline-flex" />
          <ThemeToggle />
          <AppLink href="/notes" className={cn(buttonVariants({ size: "sm" }), "ml-1.5 hidden gap-1.5 pl-2.5 sm:inline-flex")}>
            <Plus aria-hidden="true" strokeWidth={2} />
            New secret
          </AppLink>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
