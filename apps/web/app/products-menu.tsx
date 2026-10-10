"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@protectedshare/ui";
import AppLink from "../components/app-link";
import { PRODUCT_GROUPS, PRODUCT_HREFS, isActivePath, type NavProduct } from "../lib/site-nav";

function ProductItem({ item, active }: { item: NavProduct; active: boolean }) {
  const Icon = item.icon;
  return (
    <AppLink
      href={item.href}
      data-menu-item=""
      aria-current={active ? "page" : undefined}
      className="group flex items-start gap-3 rounded-[10px] px-2.5 py-2 outline-none transition-colors duration-150 hover:bg-ink/[0.04] focus-visible:bg-ink/[0.05] focus-visible:ring-2 focus-visible:ring-seal/45"
    >
      <span
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-control border border-line bg-surface text-ink-2 transition-colors group-hover:border-line-strong group-hover:text-ink",
          active && "border-line-strong text-ink"
        )}
      >
        <Icon aria-hidden="true" className="size-4" strokeWidth={1.75} />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-small font-medium text-ink">
          {item.label}
          {active ? <span className="size-1.5 rounded-full bg-seal" aria-hidden="true" /> : null}
        </span>
        <span className="mt-0.5 block text-meta leading-[17px] text-ink-3">{item.description}</span>
      </span>
    </AppLink>
  );
}

export default function ProductsMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const active = PRODUCT_HREFS.some((href) => isActivePath(pathname, href));

  const items = () => Array.from(panelRef.current?.querySelectorAll<HTMLElement>("[data-menu-item]") ?? []);

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const onButtonKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => items()[0]?.focus());
    }
  };

  const onPanelKeyDown = (event: React.KeyboardEvent) => {
    const list = items();
    const index = list.indexOf(document.activeElement as HTMLElement);
    let next = -1;
    if (event.key === "ArrowDown") next = (index + 1) % list.length;
    else if (event.key === "ArrowUp") next = (index - 1 + list.length) % list.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = list.length - 1;
    if (next >= 0) {
      event.preventDefault();
      list[next]?.focus();
    }
  };

  const onBlur = (event: React.FocusEvent) => {
    if (open && !rootRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
  };

  const [share, ...rest] = PRODUCT_GROUPS;

  return (
    <div ref={rootRef} className="relative" onBlur={onBlur}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={onButtonKeyDown}
        className={cn(
          "focus-ring relative flex h-8 items-center gap-1 rounded-control px-2.5 text-small font-medium transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal/45",
          open || active ? "text-ink" : "text-ink-2 hover:text-ink",
          open && "bg-ink/[0.05]",
          active && "after:absolute after:inset-x-2.5 after:-bottom-[15px] after:h-[2px] after:rounded-full after:bg-seal"
        )}
      >
        Products
        <ChevronDown
          aria-hidden="true"
          strokeWidth={2}
          className={cn("size-3.5 text-ink-3 transition-transform duration-200 ease-seal", open && "rotate-180")}
        />
      </button>

      <div
        ref={panelRef}
        id={panelId}
        hidden={!open}
        onKeyDown={onPanelKeyDown}
        className="absolute left-[-12px] top-[calc(100%+12px)] z-50 w-[720px] animate-drop overflow-hidden rounded-panel border border-line bg-surface shadow-float"
      >
        <div className="grid grid-cols-[1.08fr_1fr] gap-x-2 p-2">
          <section aria-labelledby={`${panelId}-share`} className="p-1.5">
            <h2 id={`${panelId}-share`} className="eyebrow px-2.5 pb-2 pt-1.5 !text-[11px]">
              {share.label}
            </h2>
            <div className="flex flex-col gap-0.5">
              {share.items.map((item) => (
                <ProductItem key={item.href} item={item} active={isActivePath(pathname, item.href)} />
              ))}
            </div>
          </section>
          <div className="flex flex-col gap-1 border-l border-line p-1.5 pl-3.5">
            {rest.map((group) => (
              <section key={group.label} aria-labelledby={`${panelId}-${group.label}`}>
                <h2 id={`${panelId}-${group.label}`} className="eyebrow px-2.5 pb-2 pt-1.5 !text-[11px]">
                  {group.label}
                </h2>
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => (
                    <ProductItem key={item.href} item={item} active={isActivePath(pathname, item.href)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-line bg-surface-2/50 px-5 py-3">
          <p className="text-meta text-ink-3">Every tool encrypts in your browser before anything is sent.</p>
          <AppLink
            href="/security"
            data-menu-item=""
            className="inline-flex items-center gap-1 rounded-[6px] text-meta font-medium text-ink-2 outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-seal/45"
          >
            How it works
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </AppLink>
        </div>
      </div>
    </div>
  );
}
