import type { CallToolResult, JsonSchemaType, ToolAnnotations } from "@modelcontextprotocol/server";
import type { ApiFetch } from "./api";

/**
 * remote: the Cloudflare Worker at https://mcp.protectedshare.me/mcp. Plaintext passes through its
 *   memory to be encrypted; key-only links, no PBKDF2 (Workers CPU limits), nothing that decrypts.
 * local: the stdio server on the user's machine (npx protectedshare-mcp). Encryption and decryption
 *   happen there; adds password options, open_secret_link and check_password_breach.
 */
export type Mode = "remote" | "local";

export type ToolContext = {
  mode: Mode;
  api: ApiFetch;
  /** Origin links are built on and accepted from, e.g. "https://protectedshare.me". */
  siteUrl: string;
  /** Network access outside ProtectedShare (only check_password_breach uses it). */
  fetch: typeof fetch;
  /** Base URL of the Pwned Passwords range API. */
  hibpUrl: string;
  /** User-Agent for requests that leave for third parties. */
  userAgent: string;
  now: () => number;
};

export type ToolDefinition = {
  name: string;
  title: string;
  /** Which servers expose this tool. */
  modes: readonly Mode[];
  description: (mode: Mode) => string;
  inputSchema: (mode: Mode) => JsonSchemaType;
  outputSchema: JsonSchemaType;
  annotations: Omit<ToolAnnotations, "title">;
  handler: (args: Record<string, unknown>, ctx: ToolContext) => Promise<CallToolResult>;
};

/** An error whose message is written for the person using the tool and safe to return as is. */
export class ToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolError";
  }
}

/** Success: the data as structured content, and the same JSON as text for clients that only read text. */
export function ok(data: Record<string, unknown>): CallToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
}

/** A tool execution error the model can read and act on. */
export function fail(message: string): CallToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

/** Epoch seconds → "2026-10-12T09:30:00Z". */
export function iso(seconds: number): string;
export function iso(seconds: number | null | undefined): string | null;
export function iso(seconds: number | null | undefined): string | null {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) return null;
  return new Date(seconds * 1000).toISOString().replace(/\.\d{3}Z$/, "Z");
}

/* ───────────── Expiry ───────────── */

export const EXPIRY_OPTIONS = ["1h", "1d", "7d", "30d"] as const;
export type ExpiryOption = (typeof EXPIRY_OPTIONS)[number];

const EXPIRY_SECONDS: Record<ExpiryOption, number> = { "1h": 3_600, "1d": 86_400, "7d": 604_800, "30d": 2_592_000 };

/**
 * The API refuses lifetimes over 30 days measured on its own clock, so "30d" keeps a few
 * minutes in hand for clock skew between this machine and the API.
 */
const MAX_LIFETIME_MARGIN_SECONDS = 300;

export function expiresAtSeconds(option: ExpiryOption, nowMs: number): number {
  const seconds = EXPIRY_SECONDS[option];
  const lifetime = option === "30d" ? seconds - MAX_LIFETIME_MARGIN_SECONDS : seconds;
  return Math.floor(nowMs / 1000) + lifetime;
}

export function expiryOption(value: unknown): ExpiryOption {
  return (EXPIRY_OPTIONS as readonly unknown[]).includes(value) ? (value as ExpiryOption) : "1d";
}

/** JSON Schema for the shared `expires_in` argument. */
export const EXPIRES_IN_SCHEMA = {
  type: "string",
  enum: [...EXPIRY_OPTIONS],
  default: "1d",
  description: "How long the link stays valid if it isn't used up: 1h, 1d, 7d or 30d. Default 1d.",
} as const;

/* ───────────── Small argument readers (inputs are already schema-validated) ───────────── */

export function str(args: Record<string, unknown>, name: string): string | undefined {
  const value = args[name];
  return typeof value === "string" ? value : undefined;
}

export function bool(args: Record<string, unknown>, name: string): boolean | undefined {
  const value = args[name];
  return typeof value === "boolean" ? value : undefined;
}

export function int(args: Record<string, unknown>, name: string): number | undefined {
  const value = args[name];
  return typeof value === "number" && Number.isInteger(value) ? value : undefined;
}
