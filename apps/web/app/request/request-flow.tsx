import { Check, Inbox, KeyRound, LockKeyhole } from "lucide-react";
import { cn } from "@protectedshare/ui";

type Step = {
  actor: string;
  title: string;
  detail: string;
  icon: typeof KeyRound;
  /** Label on the connector that leaves this step: what actually travels. */
  carries?: string;
};

const STEPS: Step[] = [
  {
    actor: "You",
    title: "Create a request",
    detail: "Your browser makes a key pair. The private half stays in your inbox link.",
    icon: KeyRound,
    carries: "their link",
  },
  {
    actor: "Them",
    title: "Paste the secret",
    detail: "Their browser seals it to your public key before it's sent.",
    icon: LockKeyhole,
    carries: "ciphertext",
  },
  {
    actor: "You",
    title: "Open it once",
    detail: "Your inbox link decrypts it. The server copy is deleted.",
    icon: Inbox,
  },
];

export type RequestFlowProps = {
  /** 1-based step to mark as current. Earlier steps show as done. */
  current?: 1 | 2 | 3;
  /** Hide the detail line (tighter, for the sender and inbox pages). */
  compact?: boolean;
  className?: string;
};

/**
 * You → them → you, drawn with hairlines. Vertical on phones, horizontal from sm up.
 * The connector labels say what crosses between people: a link, then ciphertext.
 */
export default function RequestFlow({ current, compact, className }: RequestFlowProps) {
  return (
    <ol aria-label="How a secret request works" className={cn("grid gap-0 sm:grid-cols-3 sm:gap-3", className)}>
      {STEPS.map((step, index) => {
        const number = index + 1;
        const state = current === undefined ? "idle" : number < current ? "done" : number === current ? "current" : "todo";
        const Icon = state === "done" ? Check : step.icon;
        const last = index === STEPS.length - 1;
        return (
          <li
            key={step.title}
            aria-current={state === "current" ? "step" : undefined}
            className={cn("relative pl-12 sm:pl-0", !last && (compact ? "pb-4 sm:pb-0" : "pb-5 sm:pb-0"))}
          >
            {/* Connector: vertical on phones, horizontal from sm. */}
            {!last ? (
              <>
                <span aria-hidden="true" className="absolute bottom-0 left-[15.5px] top-9 w-px bg-line-strong sm:hidden" />
                <span
                  aria-hidden="true"
                  className="absolute left-10 right-[-4px] top-4 hidden h-px items-center justify-center bg-line-strong sm:flex"
                >
                  {step.carries ? (
                    <span className="bg-surface px-1.5 font-mono text-[10.5px] leading-none text-ink-3">{step.carries}</span>
                  ) : null}
                  <svg
                    viewBox="0 0 6 8"
                    className="absolute -right-px top-1/2 h-2 w-1.5 -translate-y-1/2 text-line-strong"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.25"
                  >
                    <path d="M1 1l3.5 3L1 7" />
                  </svg>
                </span>
              </>
            ) : null}

            <span
              aria-hidden="true"
              className={cn(
                "absolute left-0 top-0 flex size-8 items-center justify-center rounded-full border bg-surface sm:relative",
                state === "current"
                  ? "border-seal/60 bg-seal-soft text-seal"
                  : state === "done"
                    ? "border-line-strong text-ok"
                    : "border-line-strong text-ink-2"
              )}
            >
              <Icon className="size-[15px]" strokeWidth={state === "done" ? 2.25 : 1.75} />
            </span>

            <div className="min-w-0 sm:mt-3">
              <p className="flex items-center gap-2 text-meta font-medium text-ink-3">
                <span className="tabular">{number}</span>
                <span aria-hidden="true" className="h-px w-2.5 bg-line-strong" />
                <span className={cn("uppercase tracking-[0.08em]", state === "current" && "text-ink")}>{step.actor}</span>
                {state === "current" ? <span className="sr-only">(current step)</span> : null}
                {state === "done" ? <span className="sr-only">(done)</span> : null}
              </p>
              <p className="mt-1 text-ui font-medium text-ink">{step.title}</p>
              {compact ? null : <p className="mt-0.5 max-w-[30ch] text-small text-ink-3">{step.detail}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
