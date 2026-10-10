"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { cn } from "@protectedshare/ui";
import { SEAL_PATH } from "./seal-mark";

export type ToastTone = "neutral" | "ok" | "danger" | "seal";

export type ToastOptions = {
  title: ReactNode;
  description?: ReactNode;
  tone?: ToastTone;
  /** ms before auto-dismiss. Default 4000; danger 6000. 0 keeps it until dismissed. */
  duration?: number;
  action?: { label: string; onClick: () => void };
};

type ToastItem = ToastOptions & { id: number };

type ToastApi = {
  /** Show a toast. Pass a string for a plain message. Returns its id. */
  toast: (options: ToastOptions | string) => number;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const noop: ToastApi = { toast: () => -1, dismiss: () => {} };

/** Access the toast queue. Safe outside the provider (does nothing). */
export function useToast(): ToastApi {
  return useContext(ToastContext) ?? noop;
}

function ToneIcon({ tone }: { tone: ToastTone }) {
  if (tone === "ok") return <CircleCheck aria-hidden="true" className="size-4 text-ok" strokeWidth={2} />;
  if (tone === "danger") return <CircleAlert aria-hidden="true" className="size-4 text-danger" strokeWidth={2} />;
  if (tone === "seal")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 text-seal">
        <path d={SEAL_PATH} fill="currentColor" />
      </svg>
    );
  return <Info aria-hidden="true" className="size-4 text-ink-3" strokeWidth={2} />;
}

function ToastView({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const tone = item.tone ?? "neutral";
  const duration = item.duration ?? (tone === "danger" ? 6000 : 4000);
  const [paused, setPaused] = useState(false);
  const remaining = useRef(duration);
  const startedAt = useRef(0);

  useEffect(() => {
    if (duration === 0 || paused) return;
    startedAt.current = Date.now();
    const timer = window.setTimeout(onDismiss, remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [paused, duration, onDismiss]);

  return (
    <li
      role={tone === "danger" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="pointer-events-auto flex w-full animate-rise items-start gap-3 rounded-[12px] border border-line bg-surface py-3 pl-3.5 pr-2 shadow-float"
    >
      <span className="mt-[3px] shrink-0">
        <ToneIcon tone={tone} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-small font-medium text-ink">{item.title}</p>
        {item.description ? <p className="mt-0.5 text-small text-ink-3">{item.description}</p> : null}
      </div>
      {item.action ? (
        <button
          type="button"
          onClick={() => {
            item.action?.onClick();
            onDismiss();
          }}
          className="mt-px h-7 shrink-0 rounded-[7px] px-2 text-small font-medium text-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-seal/45"
        >
          {item.action.label}
        </button>
      ) : null}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="flex size-7 shrink-0 items-center justify-center rounded-[7px] text-ink-3 outline-none hover:bg-ink/[0.05] hover:text-ink focus-visible:ring-2 focus-visible:ring-seal/45"
      >
        <X aria-hidden="true" className="size-3.5" />
      </button>
    </li>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback((options: ToastOptions | string) => {
    const id = nextId.current++;
    const item: ToastItem = typeof options === "string" ? { id, title: options } : { ...options, id };
    setItems((current) => [...current.slice(-2), item]);
    return id;
  }, []);

  const api = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <section aria-label="Notifications" className="pointer-events-none fixed inset-x-0 bottom-0 z-[120] flex justify-center p-4 sm:justify-end sm:p-6">
        <ol className={cn("flex w-full max-w-[380px] flex-col gap-2")}>
          {items.map((item) => (
            <ToastView key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
          ))}
        </ol>
      </section>
    </ToastContext.Provider>
  );
}
