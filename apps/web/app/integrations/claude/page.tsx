import type { Metadata } from "next";
import type { ReactNode } from "react";
import { StatusChip, buttonVariants, cn } from "@protectedshare/ui";
import CodeBlock from "../../../components/code-block";
import JsonLd from "../../../components/json-ld";
import { Breadcrumb } from "../../../components/breadcrumb";
import { DefinitionList, PageHeader, Prose, RailSection } from "../../../components/marketing";
import { SITE_NAME, SITE_URL, faqPageJsonLd, pageMetadata } from "../../../lib/seo";
import { Faq, RelatedTools } from "../../tools/_components/tool-content";
import { CLAUDE_FAQ } from "./faq";

/**
 * The public MCP endpoint and how it is reached. If the routing changes (for example a Cloudflare
 * custom domain instead of the Vercel rewrite), update RELAY and the matching FAQ answer.
 */
const ENDPOINT = "https://mcp.protectedshare.me/mcp";
const RELAY = "It goes straight to our MCP server, a Cloudflare Worker; our web host never sees it";
const PACKAGE = "protectedshare-mcp";
const REPO_URL = "https://github.com/KunalSiyag/protectedshare";

const DESCRIPTION =
  "Make encrypted, self-destructing links from Claude. The remote connector encrypts on our MCP server; the local server and the website encrypt on your device.";

export const metadata: Metadata = pageMetadata({
  title: "Claude Connector and MCP Server",
  description: DESCRIPTION,
  path: "/integrations/claude",
  keywords: [
    "claude connector",
    "mcp server",
    "claude mcp",
    "one-time secret mcp",
    "share env file claude",
    "encrypted link claude",
    "claude code mcp",
  ],
});

const code = "rounded-[5px] bg-surface-2 px-[5px] py-px font-mono text-[0.875em] text-ink";
const linkClass = "font-medium text-ink underline decoration-line-strong underline-offset-[3px] hover:decoration-ink";

type Effect = "read" | "create" | "delete";
type Tool = { name: string; what: string; effect: Effect; where: "both" | "local" };

const TOOLS: Tool[] = [
  { name: "create_secret_link", what: "Encrypts a password, key or note into a link that burns after one read by default.", effect: "create", where: "both" },
  { name: "share_env_file", what: "Encrypts a .env file or other credentials into an EnvShare link that opens 1 to 100 times. Up to 50,000 characters remotely, 200,000 locally.", effect: "create", where: "both" },
  { name: "request_secret", what: "Makes a link someone uses to send you a secret, and a private inbox link that opens their answer once.", effect: "create", where: "both" },
  { name: "check_link_status", what: "Shows whether a link was opened, how many reads are left and when it expires. Never returns the secret.", effect: "read", where: "both" },
  { name: "revoke_link", what: "Deletes a link's encrypted content right away, so it no longer opens.", effect: "delete", where: "both" },
  { name: "generate_password", what: "Makes a random password, passphrase or PIN and reports its entropy.", effect: "read", where: "both" },
  { name: "open_secret_link", what: "Decrypts a note, EnvShare or inbox link on your computer. Uses up a read, so a burn-after-reading note is deleted.", effect: "delete", where: "local" },
  { name: "check_password_breach", what: "Checks a password against Have I Been Pwned. Only 5 characters of its SHA-1 hash leave your computer.", effect: "read", where: "local" },
];

const EFFECT_LABEL: Record<Effect, string> = { read: "Read-only", create: "Creates a link", delete: "Deletes data" };

const EXAMPLES: { prompt: string; tool: string }[] = [
  { prompt: "Turn this API key into a link that works once.", tool: "create_secret_link" },
  { prompt: "Share my .env with Sam. Two reads, gone in a week.", tool: "share_env_file" },
  { prompt: "Ask Priya to send me the staging database password.", tool: "request_secret" },
  { prompt: "Has the link I sent this morning been opened?", tool: "check_link_status" },
  { prompt: "Revoke that link, I sent it to the wrong person.", tool: "revoke_link" },
  { prompt: "Open the link Sam sent and put the values in .env.local.", tool: "open_secret_link (local)" },
];

const CLAUDE_DESKTOP_CONFIG = `{
  "mcpServers": {
    "protectedshare": {
      "command": "npx",
      "args": ["-y", "${PACKAGE}"]
    }
  }
}`;

const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ProtectedShare MCP server",
  url: `${SITE_URL}/integrations/claude`,
  description: DESCRIPTION,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  softwareVersion: "0.1.0",
  isAccessibleForFree: true,
  license: "https://opensource.org/licenses/MIT",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: TOOLS.map((tool) => `${tool.name}: ${tool.what}`),
  publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
};

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="relative grid grid-cols-[28px_minmax(0,1fr)] gap-4 pb-8 last:pb-0">
      <span aria-hidden="true" className="absolute bottom-0 left-[13.5px] top-8 w-px bg-line [li:last-child>&]:hidden" />
      <span className="tabular relative flex size-7 items-center justify-center rounded-full border border-line-strong bg-surface text-meta font-semibold text-ink">
        {n}
      </span>
      <div className="min-w-0 pt-0.5">
        <h3 className="text-[16px] font-semibold leading-6 tracking-[-0.01em] text-ink">{title}</h3>
        <div className="mt-2 flex flex-col gap-3 text-ui text-ink-2">{children}</div>
      </div>
    </li>
  );
}

function Table({ caption, head, rows, minWidth = "min-w-[640px]" }: { caption: string; head: string[]; rows: ReactNode[][]; minWidth?: string }) {
  return (
    <div className="overflow-x-auto rounded-panel border border-line bg-surface">
      <table className={cn("w-full border-collapse text-left text-small", minWidth)}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line bg-surface-2/50">
            {head.map((cell) => (
              <th key={cell} scope="col" className="px-4 py-2.5 text-meta font-medium text-ink-3">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-line align-top last:border-b-0">
              {row.map((cell, cellIndex) =>
                cellIndex === 0 ? (
                  <th key={cellIndex} scope="row" className="px-4 py-3 font-medium leading-[20px] text-ink">
                    {cell}
                  </th>
                ) : (
                  <td key={cellIndex} className="px-4 py-3 leading-[20px] text-ink-2">
                    {cell}
                  </td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ClaudeIntegrationPage() {
  return (
    <main className="w-full">
      <JsonLd data={appJsonLd} />
      <JsonLd data={faqPageJsonLd(CLAUDE_FAQ)} />
      <Breadcrumb
        items={[
          { name: "Home", path: "/" },
          { name: "Integrations", path: "/integrations" },
          { name: "Claude", path: "/integrations/claude" },
        ]}
      />

      <PageHeader
        eyebrow="Integrations"
        title="Use ProtectedShare from Claude"
        lead="Ask Claude to turn a password, API key or .env file into a link that burns after reading, to request a secret from someone, or to check whether a link was opened. Add the remote connector in a minute, or run the server on your own machine so encryption happens there."
        meta={
          <>
            <StatusChip>No sign-in</StatusChip>
            <StatusChip>Remote or local</StatusChip>
            <StatusChip>Open source, MIT</StatusChip>
          </>
        }
      >
        <a href="#connector" className={buttonVariants({ variant: "primary" })}>
          Add the connector
        </a>
        <a href="#local" className={buttonVariants({ variant: "secondary" })}>
          Run it on your machine
        </a>
      </PageHeader>

      <div className="mt-8 max-w-[720px]">
        <CodeBlock label="Connector URL" code={ENDPOINT} />
      </div>

      <div className="mt-14">
        <RailSection title="What you can ask" description="Claude picks the tool. Tools that delete something ask you first.">
          <ul className="max-w-[720px] divide-y divide-line border-y border-line">
            {EXAMPLES.map((example) => (
              <li key={example.prompt} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                <span className="text-ui text-ink">&ldquo;{example.prompt}&rdquo;</span>
                <span className="shrink-0 font-mono text-[12.5px] text-ink-3">{example.tool}</span>
              </li>
            ))}
          </ul>
        </RailSection>

        <RailSection id="connector" title="Add it to Claude" description="claude.ai, Claude Desktop and Cowork. Works on every plan; the Free plan allows one custom connector.">
          <ol className="max-w-[720px]">
            <Step n={1} title="Open your connectors">
              <p>
                In Claude, go to <span className="text-ink">Customize &gt; Connectors</span>, click <span className="text-ink">+ Add</span>, then{" "}
                <span className="text-ink">Add custom connector</span>.
              </p>
            </Step>
            <Step n={2} title="Name it and paste the URL">
              <p>
                Call it <span className="text-ink">ProtectedShare</span> and use this URL, then click <span className="text-ink">Continue</span>.
              </p>
              <CodeBlock label="Remote MCP server URL" code={ENDPOINT} />
            </Step>
            <Step n={3} title="Choose No sign in">
              <p>
                Under <span className="text-ink">Authentication</span>, pick <span className="text-ink">No sign in</span> and click{" "}
                <span className="text-ink">Add</span>. There is no account to connect.
              </p>
            </Step>
            <Step n={4} title="Turn it on in a chat">
              <p>
                Click <span className="text-ink">+</span> at the lower left of the chat box, open <span className="text-ink">Connectors</span> and switch
                ProtectedShare on.
              </p>
            </Step>
          </ol>
          <div className="mt-8 flex max-w-[720px] flex-col gap-4 text-ui text-ink-2">
            <p>
              On Team and Enterprise plans an owner adds it first, under <span className="text-ink">Organization settings &gt; Connectors</span>{" "}
              (Add, Custom, Web). Members then find it in Customize &gt; Connectors.
            </p>
            <p>In Claude Code, one command adds the same server:</p>
            <CodeBlock label="Terminal" code={`claude mcp add --transport http protectedshare ${ENDPOINT}`} />
            <p>
              Other MCP clients can connect to the same URL: Streamable HTTP, no authentication.
            </p>
          </div>
        </RailSection>

        <RailSection id="local" title="Run it on your machine" description="Claude Code and Claude Desktop. Needs Node.js 20 or later.">
          <div className="flex max-w-[720px] flex-col gap-4 text-ui text-ink-2">
            <p>
              The local server encrypts and opens links on your computer, so the text never reaches us unencrypted. It also adds passwords to
              links, opens links people send you, and checks passwords against known breaches.
            </p>
            <p>Claude Code:</p>
            <CodeBlock label="Terminal" code={`claude mcp add protectedshare -- npx -y ${PACKAGE}`} />
            <p>
              Claude Desktop: open <span className="text-ink">Settings</span>, then <span className="text-ink">Developer</span>, and choose{" "}
              <span className="text-ink">Edit Config</span>. Add this to <code className={code}>claude_desktop_config.json</code> and restart Claude.
            </p>
            <CodeBlock label="claude_desktop_config.json" code={CLAUDE_DESKTOP_CONFIG} />
            <p>
              Servers set up this way run in Claude Desktop and Claude Code. claude.ai and Cowork use the remote connector.
            </p>
          </div>
          <DefinitionList
            className="mt-8 max-w-[720px]"
            termClassName="font-mono text-[12.5px]"
            items={[
              {
                term: "PROTECTEDSHARE_API_URL",
                detail: (
                  <>
                    Optional. The ProtectedShare instance to use, such as a self-hosted one. Default <code>https://protectedshare.me</code>. Must be
                    https, except for localhost.
                  </>
                ),
              },
              {
                term: "PROTECTEDSHARE_HIBP_URL",
                detail: (
                  <>
                    Optional. Where breach checks go. Default <code>https://api.pwnedpasswords.com</code>.
                  </>
                ),
              },
            ]}
          />
        </RailSection>

        <RailSection title="Tools" description="Each tool tells Claude whether it only reads, creates a link, or deletes something.">
          <Table
            caption="ProtectedShare MCP tools"
            head={["Tool", "What it does", "Effect", "Where"]}
            rows={TOOLS.map((tool) => [
              <code key="name" className="font-mono text-[12.5px] font-medium text-ink">
                {tool.name}
              </code>,
              tool.what,
              EFFECT_LABEL[tool.effect],
              tool.where === "both" ? "Remote and local" : "Local only",
            ])}
          />
        </RailSection>

        <RailSection title="Where your secret goes" description="The same encryption as the website. What changes is where it runs.">
          <Table
            caption="Where encryption happens for the website, the remote connector and the local server"
            head={["", "Website", "Remote connector", "Local server"]}
            minWidth="min-w-[720px]"
            rows={[
              ["Encrypted on", "Your browser", "ProtectedShare's MCP server (a Cloudflare Worker), in memory", "Your computer"],
              [
                "Plaintext travels to",
                "Nowhere. It stays in your browser.",
                `The MCP server, over TLS. ${RELAY}. The Worker doesn't store or log it.`,
                "Nowhere. It stays on your computer.",
              ],
              [
                "ProtectedShare stores",
                "Ciphertext, token hashes, expiry and read limits. Never the key or the plaintext.",
                "The same",
                "The same",
              ],
              ["Claude sees", "Nothing", "What you write and the link it gets back", "What you write, the link, and anything a tool opens"],
              ["Passwords on links", "Yes", "No, the key in the link only", "Yes"],
              ["Opens links", "In the browser", "No", "Yes, decrypted on your computer"],
            ]}
          />
          <p className="mt-4 max-w-[720px] text-small text-ink-3">
            The MCP server&apos;s logs hold request metadata such as the path, status code and timing, never tool arguments or results. The{" "}
            <a href="/privacy" className={linkClass}>
              privacy policy
            </a>{" "}
            covers what our hosts see.
          </p>
        </RailSection>

        <RailSection title="How it works">
          <Prose>
            <p>
              Both servers use the code that runs in the website. A random 32-byte key goes in the link after the <code>#</code>, which is
              never sent to a server. HKDF-SHA256 turns it into an AES-256-GCM key and a separate token; the server keeps the ciphertext and a
              SHA-256 hash of that token, and hands the ciphertext only to a reader who presents it. Burned, used-up, revoked and expired links
              are deleted from the database.
            </p>
            <p>
              Secret requests use ECDH P-256: the person answering encrypts in their browser to a public key whose private half is only in your
              inbox link. Every link a tool creates also gets a manage token, whose hash sits next to a receipt (opened or not, reads left,
              expiry). That is what lets Claude check or revoke a link later in the conversation.
            </p>
            <p>
              The full design is on the{" "}
              <a href="/security" className={linkClass}>
                security page
              </a>
              , and the servers are in the{" "}
              <a href={REPO_URL} className={linkClass}>
                GitHub repository
              </a>
              .
            </p>
          </Prose>
        </RailSection>

        <RailSection title="Questions">
          <div className="max-w-[720px]">
            <Faq items={CLAUDE_FAQ} />
          </div>
        </RailSection>

        <RailSection title="Do it in the browser">
          <div className="max-w-[720px]">
            <RelatedTools
              items={[
                { href: "/notes", title: "Secure note", body: "Send a password as a link that burns after one read." },
                { href: "/secrets", title: "EnvShare", body: "Share .env files and API keys with a read limit." },
                { href: "/request", title: "Secret request", body: "Ask someone to send you a secret, encrypted to you." },
                { href: "/security", title: "Security model", body: "What the server stores, and what it can't read." },
              ]}
            />
          </div>
        </RailSection>
      </div>
    </main>
  );
}
