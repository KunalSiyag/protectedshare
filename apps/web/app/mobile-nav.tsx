"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, Plus, X } from "lucide-react";
import { buttonVariants, cn } from "@protectedshare/ui";
import AppLink from "../components/app-link";
import SealMark from "../components/seal-mark";
import { PRIMARY_LINKS, PRODUCT_GROUPS, isActivePath } from "../lib/site-nav";
import { useMyLinksCount } from "../lib/my-links";

const FOCUSABLE = "a[href], button:not([disabled])";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const sheetId = useId();
  const count = useMyLinksCount();

  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const sheet = sheetRef.current;
    sheet?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !sheet) return;
      const items = Array.from(sheet.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const close = () => setOpen(false);

  const sheet = (
    <div className="fixed inset-0 z-[70] lg:hidden">
      <div aria-hidden="true" className="absolute inset-0 animate-fade-in bg-black/30 dark:bg-black/60" onClick={close} />
      <div
        ref={sheetRef}
        id={sheetId}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className="absolute inset-y-0 right-0 flex w-full max-w-[380px] animate-sheet flex-col border-l border-line bg-bg shadow-float"
      >
        <div className="flex h-header shrink-0 items-center justify-between border-b border-line px-4">
          <span className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.02em] text-ink">
            <SealMark size={22} />
            ProtectedShare
          </span>
          <button
            type="button"
            data-autofocus=""
            onClick={() => {
              close();
              buttonRef.current?.focus();
            }}
            aria-label="Close menu"
            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Mobile" className="flex-1 overflow-y-auto overscroll-contain px-3 pb-6 pt-2">
          {PRODUCT_GROUPS.map((group) => (
            <section key={group.label} className="pt-4">
              <h2 className="eyebrow px-2 pb-1.5 !text-[11px]">{group.label}</h2>
              <ul>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActivePath(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <AppLink
                        href={item.href}
                        onClick={close}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-[10px] px-2 py-2 outline-none focus-visible:ring-2 focus-visible:ring-seal/45",
                          active ? "bg-ink/[0.05]" : "active:bg-ink/[0.05]"
                        )}
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-control border border-line bg-surface text-ink-2">
                          <Icon aria-hidden="true" className="size-4" strokeWidth={1.75} />
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 text-small font-medium text-ink">
                            {item.label}
                            {active ? <span aria-hidden="true" className="size-1.5 rounded-full bg-seal" /> : null}
                          </span>
                          <span className="block truncate text-meta text-ink-3">{item.description}</span>
                        </span>
                      </AppLink>
                    </li>
                  );
                })}
              </ul>
              {group.more ? (
                <AppLink
                  href={group.more.href}
                  onClick={close}
                  aria-current={pathname === group.more.href ? "page" : undefined}
                  className="ml-[52px] mt-0.5 inline-flex h-9 items-center gap-1 rounded-control px-0 text-small font-medium text-ink-2 outline-none focus-visible:ring-2 focus-visible:ring-seal/45 active:text-ink"
                >
                  {group.more.label}
                  <ArrowRight aria-hidden="true" className="size-3.5" />
                </AppLink>
              ) : null}
            </section>
          ))}

          <div className="mx-2 mt-5 border-t border-line pt-3">
            <ul className="grid grid-cols-2 gap-x-2">
              {[...PRIMARY_LINKS, { href: "/links", label: count > 0 ? `My links (${count})` : "My links" }].map((link) => {
                const active = isActivePath(pathname, link.href);
                return (
                  <li key={link.href}>
                    <AppLink
                      href={link.href}
                      onClick={close}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-10 items-center gap-2 rounded-control px-0 text-ui font-medium outline-none focus-visible:ring-2 focus-visible:ring-seal/45",
                        active ? "text-ink" : "text-ink-2"
                      )}
                    >
                      {active ? <span aria-hidden="true" className="h-4 w-[2px] rounded-full bg-seal" /> : null}
                      {link.label}
                    </AppLink>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        <div className="shrink-0 border-t border-line p-4">
          <AppLink href="/notes" onClick={close} className={cn(buttonVariants({ size: "lg" }), "w-full")}>
            <Plus aria-hidden="true" strokeWidth={2} />
            New secret
          </AppLink>
          <p className="mt-3 text-center text-meta text-ink-3">Encrypted in your browser. No account.</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls={open ? sheetId : undefined}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "lg:hidden")}
      >
        <Menu aria-hidden="true" strokeWidth={1.75} />
      </button>
      {open && mounted ? createPortal(sheet, document.body) : null}
    </>
  );
}
