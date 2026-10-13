import AppLink from "../components/app-link";
import SealMark from "../components/seal-mark";
import { FREE_TOOLS } from "../lib/site-nav";

const GITHUB_URL = "https://github.com/KunalSiyag/protectedshare";

const columns: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Products",
    links: [
      { href: "/notes", label: "Secure note" },
      { href: "/secrets", label: "EnvShare" },
      { href: "/files", label: "File drop" },
      { href: "/request", label: "Secret request" },
      { href: "/chat", label: "Chat" },
      { href: "/notepad", label: "Notepad" },
      { href: "/links", label: "My links" },
    ],
  },
  {
    title: "Free tools",
    links: [...FREE_TOOLS.map((tool) => ({ href: tool.href, label: tool.label })), { href: "/tools", label: "All free tools" }],
  },
  {
    title: "Resources",
    links: [
      { href: "/security", label: "Security model" },
      { href: "/self-host", label: "Self-host" },
      { href: "/integrations/claude", label: "Claude connector" },
      { href: "/pricing", label: "Pricing" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Compare",
    links: [
      { href: "/vs/privnote", label: "vs Privnote" },
      { href: "/vs/onetimesecret", label: "vs OneTimeSecret" },
      { href: "/vs/envshare", label: "vs EnvShare" },
      { href: "/vs/protectedtext", label: "vs ProtectedText" },
      { href: "/vs", label: "All comparisons" },
    ],
  },
];

const legal = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className} fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

const linkClass =
  "rounded-[4px] text-small text-ink-2 outline-none transition-colors duration-150 hover:text-ink focus-visible:ring-2 focus-visible:ring-seal/45";

export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto grid max-w-content gap-x-8 gap-y-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(0,1fr))] lg:py-14">
        <div className="max-w-[320px]">
          <AppLink href="/" className="inline-flex items-center gap-2 text-[15px] font-semibold tracking-[-0.02em] text-ink">
            <SealMark size={20} />
            ProtectedShare
          </AppLink>
          <p className="mt-3 text-small text-ink-3">
            Encryption runs in your browser. The server keeps ciphertext and a verifier it can check, never your
            plaintext or your key.
          </p>
          <a
            href={GITHUB_URL}
            className="mt-5 inline-flex h-8 items-center gap-2 rounded-control border border-line bg-surface px-2.5 text-meta font-medium text-ink-2 outline-none transition-colors hover:border-line-strong hover:text-ink focus-visible:ring-2 focus-visible:ring-seal/45"
          >
            <GitHubMark className="size-3.5" />
            Source on GitHub
            <span className="text-ink-3">· MIT</span>
          </a>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4 lg:contents">
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="eyebrow !text-[11px]">{column.title}</h2>
              <ul className="mt-3.5 flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <AppLink href={link.href} className={linkClass}>
                      {link.label}
                    </AppLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-content flex-col gap-3 px-4 py-5 text-meta text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} ProtectedShare. Open source under the MIT license.</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {legal.map((link) => (
              <li key={link.href}>
                <AppLink href={link.href} className="rounded-[4px] outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-seal/45">
                  {link.label}
                </AppLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
