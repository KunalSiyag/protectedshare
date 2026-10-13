import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CodeBlock from "../../components/code-block";
import { Breadcrumb } from "../../components/breadcrumb";
import { PageHeader, RailSection } from "../../components/marketing";
import { pageMetadata } from "../../lib/seo";

const DESCRIPTION =
  "Use ProtectedShare from Claude and other MCP clients: a remote connector with no sign-in, or a local server that encrypts on your machine.";

export const metadata: Metadata = pageMetadata({
  title: "Integrations and MCP Server",
  description: DESCRIPTION,
  path: "/integrations",
  keywords: ["protectedshare mcp", "mcp server", "claude connector", "secret sharing mcp"],
});

export default function IntegrationsPage() {
  return (
    <main className="w-full">
      <Breadcrumb
        items={[
          { name: "Home", path: "/" },
          { name: "Integrations", path: "/integrations" },
        ]}
      />
      <PageHeader
        eyebrow="Integrations"
        title="Use ProtectedShare from your AI assistant"
        lead="ProtectedShare has an MCP server, so assistants like Claude can make encrypted, self-destructing links, request secrets and check on links you sent. It comes in two forms: a remote connector, and a local server that keeps encryption on your machine."
      />

      <div className="mt-14">
        <RailSection title="Claude" description="claude.ai, Claude Desktop, Cowork and Claude Code.">
          <Link
            href="/integrations/claude"
            className="group -mx-3 flex max-w-[720px] items-start justify-between gap-4 rounded-field px-3 py-3 outline-none transition-colors hover:bg-ink/[0.04] focus-visible:ring-2 focus-visible:ring-seal/45"
          >
            <span>
              <span className="block text-ui font-medium text-ink">Set up ProtectedShare in Claude</span>
              <span className="mt-0.5 block text-small text-ink-3">
                Add the custom connector, or run the local server. The tools, and where your secret goes with each.
              </span>
            </span>
            <ArrowRight
              aria-hidden="true"
              className="mt-1 size-4 shrink-0 text-ink-3 transition-transform duration-150 ease-seal group-hover:translate-x-0.5 group-hover:text-ink"
            />
          </Link>
        </RailSection>

        <RailSection title="Other MCP clients" description="Anything that speaks the Model Context Protocol.">
          <div className="flex max-w-[720px] flex-col gap-4 text-ui text-ink-2">
            <p>Remote server: Streamable HTTP, no authentication. MCP 2026-07-28, 2025-11-25, 2025-06-18 and 2025-03-26.</p>
            <CodeBlock label="Remote MCP server URL" code="https://mcp.protectedshare.me/mcp" />
            <p>Local server over stdio, for clients that start a command. Needs Node.js 20 or later.</p>
            <CodeBlock label="Command" code="npx -y protectedshare-mcp" />
          </div>
        </RailSection>
      </div>
    </main>
  );
}
