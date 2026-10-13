/**
 * create_secret_link (Secure Note) and share_env_file (EnvShare).
 *
 * Same request bodies as apps/web/app/notes/notes-client.tsx and
 * apps/web/app/secrets/secrets-client.tsx: crypto v2 `sealText` with a fresh 32-byte key (plus an
 * optional password, local mode only), the SHA-256 of a fresh manage token, epoch-second expiry.
 * The link is {site}/notes/{id}#k={key} or {site}/secrets/{id}#k={key}.
 */
import { generateKey, generateToken, hashToken, sealText } from "@protectedshare/crypto";
import type { CreateNoteV2Request, CreateSecretV2Request } from "@protectedshare/contracts";
import { ApiError, apiJson, commonFailureMessage } from "../api";
import { isShareId, sharePath, withFragment } from "../links";
import {
  EXPIRES_IN_SCHEMA,
  ToolError,
  bool,
  expiresAtSeconds,
  expiryOption,
  fail,
  int,
  iso,
  ok,
  str,
  type Mode,
  type ToolContext,
  type ToolDefinition,
} from "../shared";
import { KEY_IN_LINK_SENTENCE, encryptionSentence } from "../text";

/** Same caps as the web composers. */
export const NOTE_MAX_CHARS = 50_000;
export const ENV_MAX_CHARS = 200_000;
/**
 * The remote connector keeps EnvShare to the Secure Note cap. Measured on the Worker's code path,
 * a 200,000-character file costs about 17 ms of CPU (mostly base64url-encoding the ciphertext),
 * over the 10 ms a Workers Free request gets; 50,000 characters cost about 5.5 ms.
 */
export const REMOTE_ENV_MAX_CHARS = 50_000;

function envMax(mode: Mode): number {
  return mode === "remote" ? REMOTE_ENV_MAX_CHARS : ENV_MAX_CHARS;
}
/** The web app's minimum for a password that is added to a link key ("key+password"). */
const PASSWORD_MIN = 4;
const PASSWORD_MAX = 256;

function passwordProperty() {
  return {
    type: "string",
    minLength: PASSWORD_MIN,
    maxLength: PASSWORD_MAX,
    description:
      "Optional. When set, opening the link also needs this password (4 or more characters). Send it to the recipient another way, not with the link.",
  } as const;
}

function readPassword(args: Record<string, unknown>, ctx: ToolContext): string | undefined {
  const password = str(args, "password");
  if (password === undefined || password === "") return undefined;
  if (ctx.mode !== "local") throw new ToolError("Passwords are only available in the local ProtectedShare MCP server.");
  if (password.length < PASSWORD_MIN) throw new ToolError(`The password needs at least ${PASSWORD_MIN} characters.`);
  return password;
}

async function createShare(
  ctx: ToolContext,
  kind: "note" | "secret",
  plaintext: string,
  password: string | undefined,
  build: (sealed: Awaited<ReturnType<typeof sealText>>, manageTokenHash: string) => CreateNoteV2Request | CreateSecretV2Request
): Promise<{ id: string; url: string; manageToken: string }> {
  const key = generateKey();
  const manageToken = generateToken();
  const [sealed, manageTokenHash] = await Promise.all([sealText(plaintext, { key, password }), hashToken(manageToken)]);
  const body = build(sealed, manageTokenHash);
  let id: unknown;
  try {
    ({ id } = await apiJson<{ id: unknown }>(ctx.api, kind === "note" ? "/api/notes" : "/api/secrets", { method: "POST", body }));
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.code === "EXPIRES_AT_TOO_FAR") {
        throw new ToolError("ProtectedShare refused the expiry: this computer's clock looks ahead of the server's. Try expires_in 7d, or fix the clock.");
      }
      throw new ToolError(commonFailureMessage(error, { refused: "Nothing was stored.", unknown: "No link was returned." }));
    }
    throw error;
  }
  if (!isShareId(id)) throw new ToolError("ProtectedShare answered with an unexpected response. Nothing usable was created; try again.");
  return { id, url: withFragment(`${ctx.siteUrl}${sharePath(kind, id)}`, { k: key }), manageToken };
}

function notEmpty(value: string | undefined, field: string, max: number): string {
  if (value === undefined || !value.trim()) throw new ToolError(`\`${field}\` is empty. Pass the text to encrypt.`);
  if (value.length > max) throw new ToolError(`\`${field}\` is ${value.length.toLocaleString("en-US")} characters; the limit is ${max.toLocaleString("en-US")}.`);
  return value;
}

/* ───────────── create_secret_link ───────────── */

export const createSecretLink: ToolDefinition = {
  name: "create_secret_link",
  title: "Create secret link",
  modes: ["remote", "local"],
  description: (mode: Mode) =>
    [
      "Encrypt a secret (a password, API key, recovery code or private note) and get a self-destructing ProtectedShare link to it.",
      "By default the note is deleted the first time the link is opened; links that aren't opened expire after 1 hour, 1 day (default), 7 days or 30 days.",
      encryptionSentence(mode),
      KEY_IN_LINK_SENTENCE,
      mode === "local" ? "With a password, the recipient needs both the link and the password." : "",
      "Returns the link, its expiry and a manage_token for check_link_status and revoke_link.",
    ]
      .filter(Boolean)
      .join(" "),
  inputSchema: (mode: Mode) => ({
    type: "object",
    additionalProperties: false,
    properties: {
      text: {
        type: "string",
        minLength: 1,
        maxLength: NOTE_MAX_CHARS,
        description: `The secret to encrypt, up to ${NOTE_MAX_CHARS.toLocaleString("en-US")} characters. Markdown is shown formatted to the reader.`,
      },
      expires_in: EXPIRES_IN_SCHEMA,
      burn_after_reading: {
        type: "boolean",
        default: true,
        description: "Delete the note from the server the first time it is opened. When false, it opens any number of times until it expires. Default true.",
      },
      ...(mode === "local" ? { password: passwordProperty() } : {}),
    },
    required: ["text"],
  }),
  outputSchema: {
    type: "object",
    properties: {
      url: { type: "string", description: "The link to send. The part after '#' is the decryption key." },
      kind: { type: "string", const: "note" },
      id: { type: "string" },
      expires_at: { type: "string", description: "ISO 8601, UTC." },
      burn_after_reading: { type: "boolean" },
      password_required: { type: "boolean" },
      manage_token: { type: "string", description: "Needed by check_link_status and revoke_link. Not stored anywhere else." },
      notes: { type: "array", items: { type: "string" } },
    },
    required: ["url", "kind", "id", "expires_at", "burn_after_reading", "password_required", "manage_token", "notes"],
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  async handler(args, ctx) {
    try {
      const text = notEmpty(str(args, "text"), "text", NOTE_MAX_CHARS);
      const password = readPassword(args, ctx);
      const burn = bool(args, "burn_after_reading") ?? true;
      const expiresAt = expiresAtSeconds(expiryOption(args.expires_in), ctx.now());
      const created = await createShare(ctx, "note", text, password, (sealed, manageTokenHash) => ({
        payload: sealed.payload,
        authHash: sealed.authHash,
        manageTokenHash,
        expiresAt,
        isBurnAfterRead: burn,
      }));
      return ok({
        url: created.url,
        kind: "note",
        id: created.id,
        expires_at: iso(expiresAt),
        burn_after_reading: burn,
        password_required: Boolean(password),
        manage_token: created.manageToken,
        notes: [
          "Anyone with the whole link, including the part after '#', can open it.",
          burn
            ? "The note is deleted from the server the first time the link is opened."
            : "The note opens any number of times until it expires, then it is deleted.",
          ...(password ? ["The recipient also needs the password. Send it another way, not with the link."] : []),
          "The manage_token checks or revokes this link. It isn't saved anywhere else.",
        ],
      });
    } catch (error) {
      if (error instanceof ToolError) return fail(error.message);
      throw error;
    }
  },
};

/* ───────────── share_env_file ───────────── */

export const shareEnvFile: ToolDefinition = {
  name: "share_env_file",
  title: "Share .env file",
  modes: ["remote", "local"],
  description: (mode: Mode) =>
    [
      `Encrypt the contents of a .env file, or other credentials, config or keys (up to ${envMax(mode).toLocaleString("en-US")} characters), and get an EnvShare link that opens a set number of times, 1 to 100 (default 1), before it is deleted.`,
      "Links that aren't used up expire after 1 hour, 1 day (default), 7 days or 30 days.",
      encryptionSentence(mode),
      KEY_IN_LINK_SENTENCE,
      mode === "local" ? "With a password, the recipient needs both the link and the password." : "",
      "Returns the link, its expiry and a manage_token for check_link_status and revoke_link.",
    ]
      .filter(Boolean)
      .join(" "),
  inputSchema: (mode: Mode) => ({
    type: "object",
    additionalProperties: false,
    properties: {
      content: {
        type: "string",
        minLength: 1,
        maxLength: envMax(mode),
        description: `The text to share, usually the contents of a .env file. Up to ${envMax(mode).toLocaleString("en-US")} characters.`,
      },
      max_reads: {
        type: "integer",
        minimum: 1,
        maximum: 100,
        default: 1,
        description: "How many times the link can be opened before it is deleted, 1 to 100. Default 1.",
      },
      expires_in: EXPIRES_IN_SCHEMA,
      ...(mode === "local" ? { password: passwordProperty() } : {}),
    },
    required: ["content"],
  }),
  outputSchema: {
    type: "object",
    properties: {
      url: { type: "string", description: "The link to send. The part after '#' is the decryption key." },
      kind: { type: "string", const: "secret" },
      id: { type: "string" },
      expires_at: { type: "string", description: "ISO 8601, UTC." },
      max_reads: { type: "integer" },
      password_required: { type: "boolean" },
      manage_token: { type: "string", description: "Needed by check_link_status and revoke_link. Not stored anywhere else." },
      notes: { type: "array", items: { type: "string" } },
    },
    required: ["url", "kind", "id", "expires_at", "max_reads", "password_required", "manage_token", "notes"],
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  async handler(args, ctx) {
    try {
      const content = notEmpty(str(args, "content"), "content", envMax(ctx.mode));
      const password = readPassword(args, ctx);
      const maxReads = int(args, "max_reads") ?? 1;
      if (maxReads < 1 || maxReads > 100) throw new ToolError("max_reads must be a whole number from 1 to 100.");
      const expiresAt = expiresAtSeconds(expiryOption(args.expires_in), ctx.now());
      const created = await createShare(ctx, "secret", content, password, (sealed, manageTokenHash) => ({
        payload: sealed.payload,
        authHash: sealed.authHash,
        manageTokenHash,
        expiresAt,
        maxReads,
      }));
      return ok({
        url: created.url,
        kind: "secret",
        id: created.id,
        expires_at: iso(expiresAt),
        max_reads: maxReads,
        password_required: Boolean(password),
        manage_token: created.manageToken,
        notes: [
          "Anyone with the whole link, including the part after '#', can open it.",
          maxReads === 1
            ? "It opens once; that read deletes it from the server."
            : `It opens ${maxReads} times; the last read deletes it from the server.`,
          ...(password ? ["The recipient also needs the password. Send it another way, not with the link."] : []),
          "The manage_token checks or revokes this link. It isn't saved anywhere else.",
        ],
      });
    } catch (error) {
      if (error instanceof ToolError) return fail(error.message);
      throw error;
    }
  },
};
