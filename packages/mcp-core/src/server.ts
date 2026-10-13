import { McpServer, fromJsonSchema, type Implementation, type StandardSchemaWithJSON } from "@modelcontextprotocol/server";
import type { ApiFetch } from "./api";
import { normalizeSiteUrl } from "./links";
import { fail, type Mode, type ToolContext, type ToolDefinition } from "./shared";
import { SERVER_DESCRIPTION, instructions } from "./text";
import { DEFAULT_HIBP_URL, checkPasswordBreach } from "./tools/check-password-breach";
import { generatePasswordTool } from "./tools/generate-password";
import { checkLinkStatus, revokeLink } from "./tools/manage";
import { openSecretLink } from "./tools/open-secret-link";
import { requestSecret } from "./tools/request-secret";
import { createSecretLink, shareEnvFile } from "./tools/shares";

export const SERVER_NAME = "protectedshare";
export const SERVER_TITLE = "ProtectedShare";
export const DEFAULT_SITE_URL = "https://protectedshare.me";

/** Every tool, in the order tools/list returns them (the same order every time). */
export const TOOL_DEFINITIONS: readonly ToolDefinition[] = [
  createSecretLink,
  shareEnvFile,
  requestSecret,
  checkLinkStatus,
  revokeLink,
  generatePasswordTool,
  openSecretLink,
  checkPasswordBreach,
];

export function toolsFor(mode: Mode): ToolDefinition[] {
  return TOOL_DEFINITIONS.filter((tool) => tool.modes.includes(mode));
}

export type ServerConfig = {
  mode: Mode;
  /** Sends requests to the storage API (paths start with "/api/"). */
  api: ApiFetch;
  /** Origin of the web app, used to build and accept links. Default https://protectedshare.me. */
  siteUrl?: string;
  /** Version reported in serverInfo. */
  version: string;
  /** Network access for check_password_breach (local mode). Defaults to global fetch. */
  fetch?: typeof fetch;
  /** Pwned Passwords range API base. Default https://api.pwnedpasswords.com. */
  hibpUrl?: string;
  now?: () => number;
};

type CompiledTool = {
  definition: ToolDefinition;
  description: string;
  input: StandardSchemaWithJSON<Record<string, unknown>, Record<string, unknown>>;
  output: StandardSchemaWithJSON<Record<string, unknown>, Record<string, unknown>>;
};

/** Schemas are immutable, so they are built once per mode and shared by every request. */
const compiled = new Map<Mode, CompiledTool[]>();

function compiledTools(mode: Mode): CompiledTool[] {
  let tools = compiled.get(mode);
  if (!tools) {
    tools = toolsFor(mode).map((definition) => ({
      definition,
      description: definition.description(mode),
      input: fromJsonSchema<Record<string, unknown>>(definition.inputSchema(mode)),
      output: fromJsonSchema<Record<string, unknown>>(definition.outputSchema),
    }));
    compiled.set(mode, tools);
  }
  return tools;
}

function serverInfo(mode: Mode, version: string): Implementation {
  return {
    name: SERVER_NAME,
    title: SERVER_TITLE,
    version,
    description: SERVER_DESCRIPTION[mode],
    websiteUrl: "https://protectedshare.me/integrations/claude",
    icons: [
      { src: "https://protectedshare.me/apple-icon", mimeType: "image/png", sizes: ["180x180"] },
      { src: "https://protectedshare.me/logo.svg", mimeType: "image/svg+xml", sizes: ["any"] },
    ],
  };
}

/**
 * A fresh, fully configured server. Cheap to call: the HTTP entry calls it once per request.
 * Tool failures come back as `isError` results with a message written for the user; anything
 * unexpected becomes a generic message, so internal error text never reaches the conversation.
 */
export function createProtectedShareServer(config: ServerConfig): McpServer {
  const ctx: ToolContext = {
    mode: config.mode,
    api: config.api,
    siteUrl: normalizeSiteUrl(config.siteUrl ?? DEFAULT_SITE_URL),
    fetch: config.fetch ?? ((input, init) => fetch(input, init)),
    hibpUrl: (config.hibpUrl ?? DEFAULT_HIBP_URL).replace(/\/+$/, ""),
    userAgent: `protectedshare-mcp/${config.version}`,
    now: config.now ?? Date.now,
  };

  const server = new McpServer(serverInfo(config.mode, config.version), {
    capabilities: { tools: { listChanged: false } },
    instructions: instructions(config.mode),
    cacheHints: {
      "tools/list": { ttlMs: 600_000, cacheScope: "public" },
      "server/discover": { ttlMs: 600_000, cacheScope: "public" },
    },
    maxToolInputElements: 64,
  });

  for (const tool of compiledTools(config.mode)) {
    const { definition } = tool;
    server.registerTool(
      definition.name,
      {
        title: definition.title,
        description: tool.description,
        inputSchema: tool.input,
        outputSchema: tool.output,
        annotations: { title: definition.title, ...definition.annotations },
      },
      async (args) => {
        try {
          return await definition.handler(args ?? {}, ctx);
        } catch {
          return fail(`${definition.title} failed unexpectedly. Nothing more is known; try again in a moment.`);
        }
      }
    );
  }
  return server;
}
