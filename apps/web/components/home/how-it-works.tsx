import { ArrowDown, ArrowRight, ArrowUp, Laptop, Server, Smartphone, type LucideIcon } from "lucide-react";
import { cn } from "@protectedshare/ui";

const SAMPLE_PATH = "protectedshare.me/notes/x7Kp2Qa9Lm";
const SAMPLE_FRAGMENT = "#k=Rk3n9Vx2Lq7Tz4Yb8Wm1Pc6Hd0Js5Ga2Fe9Ku3No7";

type NodeProps = {
  icon: LucideIcon;
  label: string;
  lines: { k: string; v: string; dim?: boolean }[];
  tone?: "plain" | "server";
};

function DiagramNode({ icon: Icon, label, lines, tone = "plain" }: NodeProps) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-panel border px-4 py-3.5",
        tone === "server" ? "border-line-strong border-dashed bg-surface-2/60" : "border-line bg-surface"
      )}
    >
      <p className="flex items-center gap-2 text-meta font-semibold uppercase tracking-[0.08em] text-ink-3">
        <Icon aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
        {label}
      </p>
      <dl className="mt-3 flex flex-col gap-1.5 font-mono text-[12px] leading-[18px]">
        {lines.map((line) => (
          <div key={line.k} className="flex min-w-0 gap-2">
            <dt className="shrink-0 text-ink-3">{line.k}</dt>
            <dd className={cn("min-w-0 truncate", line.dim ? "text-ink-3" : "text-ink")}>{line.v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Wire({ label }: { label: string }) {
  return (
    <div aria-hidden="true" className="flex flex-col items-center justify-center gap-1 px-1 text-ink-3">
      <span className="font-mono text-[11px]">{label}</span>
      <span className="flex w-full min-w-[64px] items-center">
        <span className="h-px flex-1 bg-line-strong" />
        <ArrowRight className="-ml-1 size-3.5" strokeWidth={1.75} />
      </span>
    </div>
  );
}

function FragmentUrl({ className }: { className?: string }) {
  return (
    <p className={cn("font-mono text-[12px] leading-[20px] [overflow-wrap:anywhere] sm:text-[13px]", className)}>
      <span className="text-ink-3">https://</span>
      <span className="text-ink-2">{SAMPLE_PATH}</span>
      <span className="rounded-[4px] bg-ink/[0.06] px-0.5 text-ink underline decoration-ink/40 decoration-dashed underline-offset-4">
        {SAMPLE_FRAGMENT}
      </span>
    </p>
  );
}

const STEPS = [
  {
    title: "It’s sealed in your browser",
    body: "Your browser makes a random 256-bit key and encrypts with AES-256-GCM. The text never leaves the tab in the clear.",
  },
  {
    title: "We store ciphertext",
    body: "The server keeps the ciphertext, its IV and salt, and a hash it uses to check that a reader holds the key. None of that decrypts anything.",
  },
  {
    title: "They open the link",
    body: "Their browser takes the key from after the #, proves it has it, downloads the ciphertext and decrypts locally. A burn note is deleted on that read.",
  },
];

export default function HowItWorks() {
  return (
    <div className="flex flex-col gap-12">
      <figure className="min-w-0">
        {/* Desktop: two paths. Ciphertext through us, the key around us. */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-[minmax(0,1fr)_96px_minmax(0,1fr)_96px_minmax(0,1fr)] items-stretch">
            <DiagramNode
              icon={Laptop}
              label="Your browser"
              lines={[
                { k: "text", v: "\"db: hunter2-but-longer\"" },
                { k: "key ", v: "Rk3n9Vx2Lq7Tz4Yb8Wm1…" },
              ]}
            />
            <Wire label="ciphertext" />
            <DiagramNode
              icon={Server}
              label="Our server"
              tone="server"
              lines={[
                { k: "blob", v: "q3Jk8xV0bTn2LwYc9PZ4…" },
                { k: "hash", v: "7h2Lq9Xc4Vb8Nm1Zp6Rt…" },
                { k: "key ", v: "never received", dim: true },
              ]}
            />
            <Wire label="ciphertext" />
            <DiagramNode
              icon={Smartphone}
              label="Their browser"
              lines={[
                { k: "key ", v: "from #k= in the link" },
                { k: "text", v: "\"db: hunter2-but-longer\"" },
              ]}
            />
          </div>
          {/* The link path: from the sender's node, under the server, up into the recipient's node. */}
          <div aria-hidden="true" className="grid h-14 grid-cols-[minmax(0,1fr)_96px_minmax(0,1fr)_96px_minmax(0,1fr)]">
            <div className="ml-[50%] rounded-bl-[18px] border-b border-l border-dashed border-ink-3/60" />
            <div className="col-span-3 border-b border-dashed border-ink-3/60" />
            <div className="relative mr-[50%] rounded-br-[18px] border-b border-r border-dashed border-ink-3/60">
              <ArrowUp className="absolute -right-[7.5px] -top-[3px] size-3.5 text-ink-3" strokeWidth={1.75} />
            </div>
          </div>
          <div className="relative -mt-[13px] flex justify-center">
            <div className="flex max-w-[860px] flex-col items-center bg-bg px-5 text-center">
              <FragmentUrl />
              <p className="mt-1.5 text-small text-ink-3">The link goes the other way: you send it yourself, over Signal, Slack or email.</p>
            </div>
          </div>
        </div>

        {/* Mobile and tablet: a vertical flow. */}
        <div className="flex flex-col gap-2 lg:hidden">
          <DiagramNode
            icon={Laptop}
            label="Your browser"
            lines={[
              { k: "text", v: "\"db: hunter2-but-longer\"" },
              { k: "key ", v: "Rk3n9Vx2Lq7Tz4Yb8Wm1…" },
            ]}
          />
          <p aria-hidden="true" className="flex items-center justify-center gap-1.5 font-mono text-[11px] text-ink-3">
            <ArrowDown className="size-3.5" /> ciphertext
          </p>
          <DiagramNode
            icon={Server}
            label="Our server"
            tone="server"
            lines={[
              { k: "blob", v: "q3Jk8xV0bTn2LwYc9PZ4…" },
              { k: "hash", v: "7h2Lq9Xc4Vb8Nm1Zp6Rt…" },
              { k: "key ", v: "never received", dim: true },
            ]}
          />
          <p aria-hidden="true" className="flex items-center justify-center gap-1.5 font-mono text-[11px] text-ink-3">
            <ArrowDown className="size-3.5" /> ciphertext
          </p>
          <DiagramNode
            icon={Smartphone}
            label="Their browser"
            lines={[
              { k: "key ", v: "from #k= in the link" },
              { k: "text", v: "\"db: hunter2-but-longer\"" },
            ]}
          />
          <div className="mt-3 rounded-panel border border-dashed border-ink-3/60 px-4 py-3.5">
            <p className="text-meta font-semibold uppercase tracking-[0.08em] text-ink-3">The link, sent by you</p>
            <FragmentUrl className="mt-2" />
          </div>
        </div>

        <figcaption className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center lg:justify-center">
          <code className="shrink-0 rounded-control border border-line-strong bg-surface px-2.5 py-1 font-mono text-[13px] font-medium text-ink">
            #k=…
          </code>
          <span className="text-ui text-ink">
            Everything after <span className="font-mono">#</span> never reaches a server.{" "}
            <span className="text-ink-3">Browsers keep the fragment to themselves; it isn&apos;t part of the request.</span>
          </span>
        </figcaption>
      </figure>

      <ol className="grid gap-8 border-t border-line pt-8 md:grid-cols-3 md:gap-10">
        {STEPS.map((step, index) => (
          <li key={step.title} className="min-w-0">
            <p className="tabular font-mono text-[12px] text-ink-3">0{index + 1}</p>
            <h3 className="mt-2 text-[17px] font-semibold leading-[24px] tracking-[-0.015em] text-ink">{step.title}</h3>
            <p className="mt-2 text-ui text-ink-2">{step.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
