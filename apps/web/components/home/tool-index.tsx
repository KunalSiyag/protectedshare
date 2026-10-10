import { ArrowUpRight, Binary, FileLock, FileUp, Inbox, KeyRound, LockKeyhole, MessagesSquare, NotebookPen, type LucideIcon } from "lucide-react";
import AppLink from "../app-link";

type ToolRow = {
  href: string;
  name: string;
  icon: LucideIcon;
  job: string;
  facts: string[];
};

type ToolGroup = { label: string; rows: ToolRow[] };

export const TOOL_GROUPS: ToolGroup[] = [
  {
    label: "Share",
    rows: [
      {
        href: "/notes",
        name: "Secure note",
        icon: FileLock,
        job: "send a password or a private note that should open once",
        facts: ["Burn after reading", "Link key or password", "Up to 30 days"],
      },
      {
        href: "/secrets",
        name: "EnvShare",
        icon: KeyRound,
        job: "hand a teammate a .env file or a set of API keys",
        facts: ["1–100 reads", "Up to 30 days"],
      },
      {
        href: "/files",
        name: "File drop",
        icon: FileUp,
        job: "send contracts, exports or a zip without a cloud drive",
        facts: ["25 MB per drop", "1–100 downloads", "Up to 30 days"],
      },
      {
        href: "/request",
        name: "Secret request",
        icon: Inbox,
        job: "get a credential from someone who doesn’t use any of this",
        facts: ["Encrypted to your key", "One reply", "Up to 30 days"],
      },
    ],
  },
  {
    label: "Talk",
    rows: [
      {
        href: "/chat",
        name: "Chat",
        icon: MessagesSquare,
        job: "talk something through and leave no transcript behind",
        facts: ["Purged when empty", "Disappearing messages", "Safety words"],
      },
    ],
  },
  {
    label: "Keep",
    rows: [
      {
        href: "/notepad",
        name: "Notepad",
        icon: NotebookPen,
        job: "keep private notes you can open from any browser",
        facts: ["Local or synced ciphertext", "Offline HTML export"],
      },
    ],
  },
  {
    label: "Free tools",
    rows: [
      {
        href: "/tools/password-generator",
        name: "Password generator",
        icon: LockKeyhole,
        job: "make a strong password or a passphrase you can say out loud",
        facts: ["Runs offline", "Entropy shown"],
      },
      {
        href: "/tools/encrypt-text",
        name: "Encrypt text",
        icon: Binary,
        job: "lock text you’ll paste into an email, a ticket or a chat",
        facts: ["Password only", "Opens offline", "Nothing uploaded"],
      },
    ],
  },
];

/** A dense index of every tool: the job, then the limits that decide which one you want. */
export default function ToolIndex() {
  return (
    <div className="min-w-0">
      <div
        aria-hidden="true"
        className="hidden grid-cols-[230px_minmax(0,1fr)_minmax(0,400px)_20px] gap-6 border-b border-line-strong pb-2.5 text-meta font-medium text-ink-3 md:grid"
      >
        <span>Tool</span>
        <span>When you need to…</span>
        <span>Limits</span>
        <span />
      </div>
      {TOOL_GROUPS.map((group) => (
        <div key={group.label} role="group" aria-label={group.label}>
          <p className="eyebrow !text-[11px] border-b border-line pb-2 pt-6 md:pt-5">{group.label}</p>
          <ul>
            {group.rows.map((row) => {
              const Icon = row.icon;
              return (
                <li key={row.href} className="border-b border-line">
                  <AppLink
                    href={row.href}
                    className="group -mx-3 grid grid-cols-[minmax(0,1fr)_20px] items-start gap-x-4 gap-y-1 rounded-control px-3 py-3.5 outline-none transition-colors duration-150 ease-seal hover:bg-ink/[0.035] focus-visible:ring-2 focus-visible:ring-seal/45 md:grid-cols-[230px_minmax(0,1fr)_minmax(0,400px)_20px] md:items-center md:gap-6"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-control border border-line bg-surface text-ink-2 transition-colors group-hover:border-line-strong group-hover:text-ink">
                        <Icon aria-hidden="true" className="size-4" strokeWidth={1.75} />
                      </span>
                      <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{row.name}</span>
                    </span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="col-start-2 row-start-1 size-4 self-center text-ink-3 transition-transform duration-150 ease-seal group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink md:col-start-4"
                    />
                    <span className="col-span-2 text-ui text-ink-2 md:col-span-1 md:col-start-2 md:row-start-1">
                      <span className="text-ink-3 md:hidden">When you need to </span>
                      {row.job}
                    </span>
                    <span className="tabular col-span-2 flex flex-wrap gap-x-2 gap-y-0.5 text-small text-ink-3 md:col-span-1 md:col-start-3 md:row-start-1">
                      {row.facts.map((fact, index) => (
                        <span key={fact} className="whitespace-nowrap">
                          {index > 0 ? <span aria-hidden="true" className="mr-2 text-line-strong">/</span> : null}
                          {fact}
                        </span>
                      ))}
                    </span>
                  </AppLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
