import AppLink from "../app-link";

export type StoreRow = {
  tool: string;
  href?: string;
  stored: string;
  local: string;
  gone: string;
};

export const STORE_ROWS: StoreRow[] = [
  {
    tool: "Secure note, EnvShare",
    href: "/notes",
    stored: "Ciphertext, IV, salt, the KDF mode, a hash of the read token, the expiry, and the burn flag or reads left.",
    local: "Your text, the key, and your password if you set one.",
    gone: "On the burning read, the last allowed read, or at expiry.",
  },
  {
    tool: "File drop",
    href: "/files",
    stored: "Encrypted chunks, an encrypted manifest, the total encrypted size, chunk count, downloads left, expiry, and a hash of each download's session token.",
    local: "File names, types, sizes and contents (names sit inside the encrypted manifest), and the key.",
    gone: "Once the last allowed download finishes or its session lapses, at expiry, or 6 hours after an upload that never finished.",
  },
  {
    tool: "Secret request",
    href: "/request",
    stored: "Your public key, the encrypted label, the encrypted reply, and hashes of the respond and inbox tokens.",
    local: "Your private key (only in your inbox link), the reply in the clear, the label key (only in the sender link).",
    gone: "When you collect the reply, or at expiry.",
  },
  {
    tool: "Chat",
    href: "/chat",
    stored: "Encrypted messages with timestamps, optional per-message expiry, a room auth hash, and presence: a random client id, a typing flag, last seen.",
    local: "Messages in the clear, the room key or password.",
    gone: "Messages when everyone has left, or when they expire. Rooms after 7 idle days.",
  },
  {
    tool: "Notepad, synced",
    href: "/notepad",
    stored: "A SHA-256 of your username, the encrypted vault, a password proof, and save times. Local mode stores nothing with us.",
    local: "Your notes and your password.",
    gone: "When you delete the workspace.",
  },
  {
    tool: "Read receipts",
    href: "/links",
    stored: "Kind, id, status, read count, and created, expiry, first-read and last-read times. A hash of the manage token.",
    local: "The links in My links. The manage token is kept there too, and sent only to check status or revoke.",
    gone: "30 days after the share expires.",
  },
  {
    tool: "Password generator, Encrypt text",
    stored: "Nothing. They never make a request with your data.",
    local: "Everything.",
    gone: "Nothing to delete.",
  },
];

/** "What we store, exactly": the stored/never-stored split for every tool. */
export default function WhatWeStore() {
  return (
    <div className="min-w-0">
      <div className="overflow-hidden rounded-panel border border-line bg-surface">
        <div
          aria-hidden="true"
          className="hidden grid-cols-[170px_minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,0.85fr)] gap-6 border-b border-line bg-surface-2/50 px-5 py-2.5 text-meta font-medium text-ink-3 lg:grid"
        >
          <span>Tool</span>
          <span>Stored on our server</span>
          <span>Never sent to our server</span>
          <span>Deleted</span>
        </div>
        <ul className="divide-y divide-line">
          {STORE_ROWS.map((row) => (
            <li key={row.tool} className="grid gap-x-6 gap-y-3 px-5 py-4 lg:grid-cols-[170px_minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,0.85fr)]">
              <p className="text-ui font-semibold text-ink">
                {row.href ? (
                  <AppLink href={row.href} className="rounded-[4px] outline-none hover:underline hover:decoration-line-strong hover:underline-offset-4 focus-visible:ring-2 focus-visible:ring-seal/45">
                    {row.tool}
                  </AppLink>
                ) : (
                  row.tool
                )}
              </p>
              <div className="min-w-0">
                <p className="mb-1 text-meta font-medium text-ink-3 lg:hidden">Stored on our server</p>
                <p className="text-small leading-[20px] text-ink-2">{row.stored}</p>
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-meta font-medium text-ink-3 lg:hidden">Never sent to our server</p>
                <p className="text-small leading-[20px] text-ink">{row.local}</p>
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-meta font-medium text-ink-3 lg:hidden">Deleted</p>
                <p className="text-small leading-[20px] text-ink-2">{row.gone}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-4 max-w-[80ch] text-small text-ink-3">
        Keys travel inside the link you share, after the #, which browsers don&apos;t send. Around every request: API
        calls pass through the web app&apos;s host to Cloudflare, which runs the API, and both see IP addresses, request
        metadata and the ciphertext going by, like any host would. Workers logs are on. Google Analytics loads only if
        the operator sets an ID, and never on pages that open or hold a share. The contact form stores the name, email,
        company and message you send. Expired rows are purged every 30 minutes, and reads past expiry are refused.
      </p>
    </div>
  );
}
