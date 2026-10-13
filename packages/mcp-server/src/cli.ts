/**
 * protectedshare-mcp: ProtectedShare's local MCP server over stdio.
 *
 * Encryption and decryption run in this process; ProtectedShare's API only receives ciphertext,
 * hashes and tokens. stdout carries MCP messages only; diagnostics go to stderr and never include
 * arguments, results or secrets.
 */
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { DEFAULT_HIBP_URL, DEFAULT_SITE_URL, createProtectedShareServer, toolsFor, type ApiFetch } from "@protectedshare/mcp-core";

declare const __VERSION__: string;
const VERSION = typeof __VERSION__ === "string" ? __VERSION__ : "0.0.0-dev";

const HELP = `protectedshare-mcp ${VERSION}

Local MCP server for ProtectedShare (https://protectedshare.me): create and open end-to-end
encrypted, self-destructing links from Claude and other MCP clients. It speaks MCP over stdio,
so an MCP client starts it; there is nothing to run by hand.

  Claude Code:     claude mcp add protectedshare -- npx -y protectedshare-mcp
  Claude Desktop:  { "mcpServers": { "protectedshare": { "command": "npx", "args": ["-y", "protectedshare-mcp"] } } }

Tools: ${toolsFor("local")
  .map((tool) => tool.name)
  .join(", ")}

Environment:
  PROTECTEDSHARE_API_URL   ProtectedShare instance (web app origin). Default ${DEFAULT_SITE_URL}.
                           Must be https, except for localhost.
  PROTECTEDSHARE_HIBP_URL  Pwned Passwords range API. Default ${DEFAULT_HIBP_URL}.

Options: --help, --version
Docs and privacy: https://protectedshare.me/integrations/claude
`;

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

/** An origin from an environment variable: https, or http for localhost only. */
function originFromEnv(name: string, fallback: string): string {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`${name} is not a valid URL.`);
  }
  if (url.protocol !== "https:" && !(url.protocol === "http:" && isLocalHost(url.hostname))) {
    throw new Error(`${name} must use https (http is allowed for localhost only).`);
  }
  return url.origin;
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(HELP);
    return;
  }
  if (args.includes("--version") || args.includes("-v")) {
    process.stdout.write(`${VERSION}\n`);
    return;
  }
  if (args.length > 0) {
    process.stderr.write(`protectedshare-mcp: unknown argument ${JSON.stringify(args[0])}. See --help.\n`);
    process.exit(2);
  }

  let site: string;
  let hibpUrl: string;
  try {
    site = originFromEnv("PROTECTEDSHARE_API_URL", DEFAULT_SITE_URL);
    hibpUrl = originFromEnv("PROTECTEDSHARE_HIBP_URL", DEFAULT_HIBP_URL);
  } catch (error) {
    process.stderr.write(`protectedshare-mcp: ${error instanceof Error ? error.message : "invalid configuration"}\n`);
    process.exit(1);
  }

  const userAgent = `protectedshare-mcp/${VERSION}`;
  const api: ApiFetch = (path, init) =>
    fetch(`${site}${path}`, { ...init, headers: { ...(init.headers as Record<string, string>), "User-Agent": userAgent } });

  serveStdio(() => createProtectedShareServer({ mode: "local", api, siteUrl: site, version: VERSION, hibpUrl }), {
    onerror: (error) => process.stderr.write(`protectedshare-mcp: ${error.name}\n`),
  });
}

main();
