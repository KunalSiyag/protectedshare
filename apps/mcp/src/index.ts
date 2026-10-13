/**
 * ProtectedShare remote MCP server (Cloudflare Worker "protectedshare-mcp").
 *
 *   POST /mcp   MCP over Streamable HTTP, both protocol eras, stateless, JSON responses:
 *               - 2026-07-28 ("modern", per-request _meta): the official SDK's createMcpHandler,
 *                 which validates MCP-Protocol-Version / Mcp-Method / Mcp-Name against the body.
 *               - 2025-11-25, 2025-06-18, 2025-03-26 ("legacy", initialize handshake): the SDK's
 *                 Streamable HTTP transport per request, without sessions.
 *               One JSON-RPC message per POST: batch arrays are refused (400) in both eras.
 *               GET and DELETE answer 405. A present Origin header must be allowlisted (403).
 *   GET /       a short plain-text description
 *   GET /health {"status":"ok"}
 *
 * Tools come from @protectedshare/mcp-core in "remote" mode. Plaintext handed to a tool exists
 * only in this request's memory while it is encrypted; nothing here logs arguments, results or
 * request bodies. The storage API (Service Binding API, or API_BASE_URL) receives ciphertext and
 * hashes to create a link, and a link's kind, id and manage token to check or revoke it.
 */
import {
  WebStandardStreamableHTTPServerTransport,
  createMcpHandler,
  isLegacyRequest,
  localhostAllowedOrigins,
  originValidationResponse,
  readRequestBody,
  type McpHttpHandler,
} from "@modelcontextprotocol/server";
import { DEFAULT_SITE_URL, createProtectedShareServer, type ApiFetch } from "@protectedshare/mcp-core";

export interface Env {
  /** Service Binding to the protectedshare-api Worker. Used unless API_BASE_URL is set. */
  API?: Fetcher;
  /** Storage API base URL, e.g. http://localhost:8787 in development. Overrides the binding. */
  API_BASE_URL?: string;
  /** Origin the links point at. Default https://protectedshare.me. */
  SITE_URL?: string;
  /** Comma-separated hostnames allowed in an Origin header, in addition to localhost. */
  ALLOWED_ORIGINS?: string;
  /** Optional flood guard (Workers Rate Limiting): MCP requests per client IP. */
  RL_MCP?: RateLimit;
  /** Optional (Workers Rate Limiting): calls to the tools that create links, per client IP. */
  RL_MCP_CREATE?: RateLimit;
}

const VERSION = "0.1.0";

/**
 * Largest MCP request body read. The biggest argument the remote tools take is 50,000 characters,
 * which stays under this even when every character is JSON-escaped.
 */
const MAX_BODY_BYTES = 512_000;

/** Application error code for the rate limiters (outside JSON-RPC's reserved -32768..-32000). */
const RATE_LIMITED_CODE = -31429;

/** Tools that create a link (a share or request in the storage API). RL_MCP_CREATE counts calls to them. */
const CREATING_TOOLS: ReadonlySet<string> = new Set(["create_secret_link", "share_env_file", "request_secret"]);

const SECURITY_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

function apiFetcher(env: Env): ApiFetch {
  const base = env.API_BASE_URL?.trim().replace(/\/+$/, "");
  if (base) return (path, init) => fetch(`${base}${path}`, init);
  const binding = env.API;
  if (binding) return (path, init) => binding.fetch(new Request(`https://protectedshare-api.internal${path}`, init));
  return (path, init) => fetch(`${DEFAULT_SITE_URL}${path}`, init);
}

function siteUrl(env: Env): string {
  return env.SITE_URL?.trim() || DEFAULT_SITE_URL;
}

/** Reports rejected or failed exchanges without their content: error messages can quote request data. */
function logFailure(error: Error): void {
  console.warn(`mcp: request rejected or failed (${error.name})`);
}

type Serving = { env: Env; modern: McpHttpHandler; factory: () => ReturnType<typeof createProtectedShareServer> };
let serving: Serving | null = null;

/** One handler per isolate (env is the same object for every request an isolate serves). */
function servingFor(env: Env): Serving {
  if (serving?.env === env) return serving;
  const api = apiFetcher(env);
  const site = siteUrl(env);
  const factory = () => createProtectedShareServer({ mode: "remote", api, siteUrl: site, version: VERSION });
  const modern = createMcpHandler(factory, {
    legacy: "reject",
    responseMode: "json",
    maxRequestBodySize: MAX_BODY_BYTES,
    onerror: logFailure,
  });
  serving = { env, modern, factory };
  return serving;
}

/** 2025-era request: a fresh server and stateless transport (no session id), JSON response. */
async function serveLegacy(request: Request, factory: Serving["factory"], parsedBody: unknown): Promise<Response> {
  const server = factory();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
    maxRequestBodySize: MAX_BODY_BYTES,
  });
  try {
    await server.connect(transport);
    return await transport.handleRequest(request, { parsedBody });
  } catch (error) {
    logFailure(error instanceof Error ? error : new Error("unknown"));
    return jsonRpcError(500, -32603, "Internal error");
  } finally {
    // In JSON mode the response is complete once handleRequest resolves.
    transport.close().catch(() => {});
    server.close().catch(() => {});
  }
}

function jsonRpcError(status: number, code: number, message: string, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code, message } }), {
    status,
    headers: { "Content-Type": "application/json", ...SECURITY_HEADERS, ...headers },
  });
}

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(name)) headers.set(name, value);
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function allowedOriginHostnames(env: Env): string[] {
  const extra = (env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  return [...localhostAllowedOrigins(), ...extra];
}

/**
 * Reads the POST body once, within MAX_BODY_BYTES, and parses it, so the checks below and the SDK
 * (handed it as parsedBody) all see the same message. Answers what the SDK answers for a body
 * that is too large (413) or can't be read or parsed (400).
 */
async function readMessage(request: Request): Promise<{ message: unknown } | Response> {
  let text: string;
  try {
    const body = await readRequestBody(request, MAX_BODY_BYTES);
    if (body.tooLarge) return jsonRpcError(413, -32000, `Payload Too Large: Request body must not exceed ${MAX_BODY_BYTES} bytes`);
    text = body.text;
  } catch {
    return jsonRpcError(400, -32700, "Parse error: the request body could not be read");
  }
  try {
    return { message: JSON.parse(text) as unknown };
  } catch {
    return jsonRpcError(400, -32700, "Parse error: Invalid JSON");
  }
}

/**
 * The tool a tools/call names, from the parsed body: what the SDK dispatches on. (For modern
 * requests the SDK also checks the Mcp-Name header against it, so the header is never trusted here.)
 */
function calledTool(message: unknown): string | undefined {
  if (!message || typeof message !== "object") return undefined;
  const { method, params } = message as { method?: unknown; params?: unknown };
  if (method !== "tools/call" || !params || typeof params !== "object") return undefined;
  const { name } = params as { name?: unknown };
  return typeof name === "string" ? name : undefined;
}

/* ------------------------------ Rate limits ------------------------------ */

function isLoopback(ip: string): boolean {
  return ip === "::1" || ip.startsWith("127.") || ip.startsWith("::ffff:127.");
}

/**
 * IPv4 as is; IPv6 grouped by its /64, so one host can't rotate through its own subnet.
 * Copied from apps/api/src/lib/limits.ts (the two Workers share no code).
 */
function ipBucket(ip: string): string {
  if (!ip.includes(":")) return ip;
  // IPv4-mapped IPv6 (::ffff:203.0.113.7) is really that IPv4 address.
  const mapped = /(?:^|:)(\d{1,3}(?:\.\d{1,3}){3})$/.exec(ip);
  if (mapped) return mapped[1];
  const [head, tail] = ip.toLowerCase().split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const groups =
    tail === undefined ? left : [...left, ...Array<string>(Math.max(0, 8 - left.length - right.length)).fill("0"), ...right];
  return `${groups.slice(0, 4).map((group) => group.replace(/^0+(?=.)/, "") || "0").join(":")}::/64`;
}

/** The connecting IP's bucket, or null for loopback (wrangler dev) and a missing header. */
function clientBucket(request: Request): string | null {
  const ip = request.headers.get("cf-connecting-ip")?.trim();
  return ip && !isLoopback(ip) ? ipBucket(ip) : null;
}

/** Counts one hit; true once `key` is over the limit. No binding, or a limiter outage, never limits. */
async function overLimit(limiter: RateLimit | undefined, key: string): Promise<boolean> {
  if (!limiter) return false;
  try {
    const { success } = await limiter.limit({ key });
    return !success;
  } catch {
    return false; // A limiter outage must not take the server down.
  }
}

function rateLimited(message: string): Response {
  return jsonRpcError(429, RATE_LIMITED_CODE, message, { "Retry-After": "60" });
}

function landing(env: Env, origin: string): Response {
  const site = siteUrl(env);
  const body = [
    "ProtectedShare MCP server",
    "",
    // The endpoint is wherever this Worker answers (custom domain, workers.dev, or a self-hosted host).
    `Endpoint: ${origin}/mcp (Streamable HTTP, no sign-in)`,
    `Setup and privacy: ${site}/integrations/claude`,
    "Source: https://github.com/KunalSiyag/protectedshare",
    "",
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", ...SECURITY_HEADERS } });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname, origin } = new URL(request.url);

    if (pathname === "/health") {
      return Response.json({ status: "ok", version: VERSION }, { headers: SECURITY_HEADERS });
    }
    if (pathname === "/" && (request.method === "GET" || request.method === "HEAD")) {
      return landing(env, origin);
    }
    if (pathname !== "/mcp" && pathname !== "/mcp/") {
      return new Response("Not found\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8", ...SECURITY_HEADERS } });
    }

    // DNS-rebinding and cross-site protection: a present Origin must be allowlisted.
    const forbidden = originValidationResponse(request, allowedOriginHostnames(env));
    if (forbidden) return withSecurityHeaders(forbidden);

    const { modern, factory } = servingFor(env);
    // GET and DELETE: the SDK's handler answers 405.
    if (request.method !== "POST") return withSecurityHeaders(await modern.fetch(request));

    // Flood guard keyed on the connecting IP. Generous: Claude's connector traffic arrives from shared egress IPs.
    const bucket = clientBucket(request);
    if (bucket && (await overLimit(env.RL_MCP, `mcp:${bucket}`))) {
      return rateLimited("Too many requests to ProtectedShare's MCP server from this network. Wait a minute, then try again.");
    }

    const read = await readMessage(request);
    if (read instanceof Response) return read;
    const { message } = read;
    // The legacy transport would run every call in a batch (up to 100) on one request, past both limiters.
    if (Array.isArray(message)) {
      return jsonRpcError(400, -32600, "Invalid Request: JSON-RPC batches are not supported. Send one message per request.");
    }
    const tool = calledTool(message);
    if (bucket && tool !== undefined && CREATING_TOOLS.has(tool) && (await overLimit(env.RL_MCP_CREATE, `mcp-create:${bucket}`))) {
      return rateLimited("Too many new links from this network in a short time. Wait a minute, then try again.");
    }

    if (await isLegacyRequest(request, message)) {
      return withSecurityHeaders(await serveLegacy(request, factory, message));
    }
    // Modern and malformed requests go to the SDK's handler, which validates this same parsed body.
    return withSecurityHeaders(await modern.fetch(request, { parsedBody: message }));
  },
} satisfies ExportedHandler<Env>;
