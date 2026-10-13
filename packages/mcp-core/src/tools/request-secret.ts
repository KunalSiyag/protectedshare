/**
 * request_secret: the request protocol of apps/web/app/request/request-client.tsx, step for step.
 *
 *   keys       createRequestKeys()            P-256 pair; inboxHash = SHA-256(HKDF(SHA-256(pkcs8)))
 *   labelKey   generateKey()                  rides in both links as #k=
 *   respond    deriveRespondToken(labelKey)   the server keeps respondHash, the sender's browser
 *                                             presents the token to answer
 *   label      encryptJson(importRawKey(labelKey), { title?, note?, pk })
 *              pk = SHA-256(raw public key): the sender's browser refuses to answer when it
 *              doesn't match the public key the server hands out
 *
 * Links: {site}/request/{id}#k={labelKey} and {site}/request/{id}/inbox#p={pkcs8}&k={labelKey}.
 */
import {
  createRequestKeys,
  deriveRespondToken,
  encryptJson,
  generateKey,
  generateToken,
  hashToken,
  importRawKey,
  publicKeyFingerprint,
} from "@protectedshare/crypto";
import type { CreateRequestRequest } from "@protectedshare/contracts";
import { ApiError, apiJson, commonFailureMessage } from "../api";
import { isShareId, withFragment } from "../links";
import { EXPIRES_IN_SCHEMA, ToolError, expiresAtSeconds, expiryOption, fail, iso, ok, str, type Mode, type ToolDefinition } from "../shared";

/** Same limits as apps/web/app/request/request-shared.ts. */
export const TITLE_MAX = 120;
export const NOTE_MAX = 600;
/** The API caps the encrypted label at 4,000 base64url characters. */
const LABEL_BLOB_MAX = 4_000;

type LabelPayload = { title?: string; note?: string; pk: string };

/** Byte-compatible with sealLabel() in apps/web/app/request/request-shared.ts. */
export async function sealRequestLabel(labelKey: string, title: string, note: string, publicKey: string) {
  const payload: LabelPayload = {
    ...(title ? { title } : {}),
    ...(note ? { note } : {}),
    pk: await publicKeyFingerprint(publicKey),
  };
  return encryptJson(await importRawKey(labelKey), payload);
}

export const requestSecret: ToolDefinition = {
  name: "request_secret",
  title: "Request a secret",
  modes: ["remote", "local"],
  description: (mode: Mode) =>
    [
      "Create a secret request: a link to give someone who has a secret you need (a password, API key or .env file).",
      "They open it in a browser and type or paste the secret, and their browser encrypts it to a key that only your private inbox link holds.",
      "Returns send_link (for them) and inbox_link (for you: it opens the answer once, then the request is deleted). The optional title and note are encrypted as well.",
      mode === "remote"
        ? "The request's keys are generated on ProtectedShare's MCP server and returned in the links; they aren't stored. The answer opens in a browser from the inbox link."
        : "The keys are generated on this computer. The answer can be opened in a browser or with open_secret_link.",
      "Expires after 1 hour, 1 day (default), 7 days or 30 days.",
    ].join(" "),
  inputSchema: () => ({
    type: "object",
    additionalProperties: false,
    properties: {
      title: {
        type: "string",
        maxLength: TITLE_MAX,
        description: `Optional. What you're asking for, shown to the sender, e.g. "Staging database password". Up to ${TITLE_MAX} characters.`,
      },
      note: {
        type: "string",
        maxLength: NOTE_MAX,
        description: `Optional. A longer note for the sender. Up to ${NOTE_MAX} characters.`,
      },
      expires_in: EXPIRES_IN_SCHEMA,
    },
  }),
  outputSchema: {
    type: "object",
    properties: {
      send_link: { type: "string", description: "Give this to the person who has the secret. They answer in a browser." },
      inbox_link: { type: "string", description: "Private. Opens the answer once. Contains the private key after '#'." },
      kind: { type: "string", const: "request" },
      id: { type: "string" },
      expires_at: { type: "string", description: "ISO 8601, UTC." },
      manage_token: { type: "string", description: "Needed by check_link_status and revoke_link. Not stored anywhere else." },
      notes: { type: "array", items: { type: "string" } },
    },
    required: ["send_link", "inbox_link", "kind", "id", "expires_at", "manage_token", "notes"],
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  async handler(args, ctx) {
    try {
      const title = (str(args, "title") ?? "").trim();
      const note = (str(args, "note") ?? "").trim();
      if (title.length > TITLE_MAX) throw new ToolError(`The title can be up to ${TITLE_MAX} characters.`);
      if (note.length > NOTE_MAX) throw new ToolError(`The note can be up to ${NOTE_MAX} characters.`);

      const pair = await createRequestKeys();
      const labelKey = generateKey();
      const manageToken = generateToken();
      const [{ respondHash }, manageTokenHash, label] = await Promise.all([
        deriveRespondToken(labelKey),
        hashToken(manageToken),
        sealRequestLabel(labelKey, title, note, pair.publicKey),
      ]);
      if (label.encryptedBlob.length > LABEL_BLOB_MAX) {
        throw new ToolError("The title and note are too long together. Shorten the note.");
      }
      const expiresAt = expiresAtSeconds(expiryOption(args.expires_in), ctx.now());
      const body: CreateRequestRequest = {
        publicKey: pair.publicKey,
        label,
        inboxHash: pair.inboxHash,
        respondHash,
        manageTokenHash,
        expiresAt,
      };

      let id: unknown;
      try {
        ({ id } = await apiJson<{ id: unknown }>(ctx.api, "/api/requests", { method: "POST", body }));
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.code === "EXPIRES_AT_TOO_FAR") {
            throw new ToolError("ProtectedShare refused the expiry: this computer's clock looks ahead of the server's. Try expires_in 7d, or fix the clock.");
          }
          throw new ToolError(commonFailureMessage(error, { refused: "No request was created.", unknown: "No links were returned." }));
        }
        throw error;
      }
      if (!isShareId(id)) throw new ToolError("ProtectedShare answered with an unexpected response. No usable request was created; try again.");

      const base = `${ctx.siteUrl}/request/${encodeURIComponent(id)}`;
      return ok({
        send_link: withFragment(base, { k: labelKey }),
        inbox_link: withFragment(`${base}/inbox`, { p: pair.privateKey, k: labelKey }),
        kind: "request",
        id,
        expires_at: iso(expiresAt),
        manage_token: manageToken,
        notes: [
          "send_link is for the person who has the secret. It accepts one answer.",
          "inbox_link is private: anyone holding it can read the answer. It opens the answer once, and then the request is deleted.",
          "check_link_status with the manage_token shows whether an answer has arrived.",
        ],
      });
    } catch (error) {
      if (error instanceof ToolError) return fail(error.message);
      throw error;
    }
  },
};
