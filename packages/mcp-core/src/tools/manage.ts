/**
 * check_link_status and revoke_link: GET / DELETE /api/manage/{kind}/{id} with X-Manage-Token,
 * the receipts behind "My links" in the web app. Only the link's kind and id are sent, never
 * the fragment. Receipts hold no content.
 */
import type { ManageStatusResponse } from "@protectedshare/contracts";
import { ApiError, MANAGE_HEADER, apiJson, commonFailureMessage } from "../api";
import { isSameSite, parseShareLink, type LinkKind, type ShareLink } from "../links";
import { ToolError, fail, iso, ok, str, type ToolContext, type ToolDefinition } from "../shared";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,256}$/;

const KIND_LABEL: Record<LinkKind, string> = {
  note: "Secure Note",
  secret: "EnvShare link",
  drop: "File drop",
  request: "Secret request",
};

export function requireLink(ctx: ToolContext, url: string | undefined): ShareLink {
  const link = url ? parseShareLink(url) : null;
  if (!link) {
    throw new ToolError(
      `That isn't a ProtectedShare link. Pass the whole link, like ${ctx.siteUrl}/notes/AbCdEf1234#k=… (also /secrets/, /files/ or /request/ links).`
    );
  }
  if (!isSameSite(link.origin, ctx.siteUrl)) {
    throw new ToolError(`This server works with links on ${ctx.siteUrl}. That link is on ${link.origin}.`);
  }
  return link;
}

function requireToken(token: string | undefined): string {
  const value = token?.trim();
  if (!value || !TOKEN_PATTERN.test(value)) {
    throw new ToolError("manage_token doesn't look right. Use the manage_token returned when the link was created (16–256 letters, digits, '-' or '_').");
  }
  return value;
}

function summarize(status: ManageStatusResponse): string {
  const label = KIND_LABEL[status.kind];
  const expires = iso(status.expiresAt);
  if (status.status === "revoked") return `${label} revoked. Its content was deleted and the link no longer opens.`;
  if (status.status === "expired") return `${label} expired at ${expires}. The link no longer opens.`;
  if (status.kind === "request") {
    if (status.status === "consumed") return "The answer was opened from the inbox link, and the request was deleted.";
    return status.reads > 0
      ? `Answered. The answer is waiting for the inbox link (until ${expires}).`
      : `Not answered yet. The request stays open until ${expires}.`;
  }
  if (status.status === "consumed") {
    return status.kind === "drop"
      ? `${label} used up: every download was started, and the files were deleted.`
      : `${label} opened and deleted (${status.reads === 1 ? "1 read" : `${status.reads} reads`}).`;
  }
  const opened = status.reads === 0 ? "Not opened yet." : `Opened ${status.reads === 1 ? "once" : `${status.reads} times`}.`;
  const left = status.readsRemaining === null ? "" : ` ${status.readsRemaining} ${status.readsRemaining === 1 ? "read" : "reads"} left.`;
  return `${opened}${left} Expires ${expires}.`;
}

function statusData(status: ManageStatusResponse): Record<string, unknown> {
  return {
    kind: status.kind,
    id: status.id,
    status: status.status,
    reads: status.reads,
    max_reads: status.maxReads,
    reads_remaining: status.readsRemaining,
    created_at: iso(status.createdAt),
    expires_at: iso(status.expiresAt),
    first_read_at: iso(status.firstReadAt),
    last_read_at: iso(status.lastReadAt),
    summary: summarize(status),
  };
}

function manageFailure(error: ApiError, revoking: boolean): string {
  if (error.failure === "not_found") {
    return "ProtectedShare has no record for this link. Either it was created without a manage token, the record was removed (30 days after the link expired), or the link is wrong.";
  }
  const refused = revoking ? "Nothing was revoked." : "";
  if (error.failure === "unauthorized") return ["The manage_token doesn't match this link.", refused].filter(Boolean).join(" ");
  return commonFailureMessage(error, {
    refused,
    unknown: revoking ? "The link may or may not have been revoked; check_link_status shows its state." : "",
  });
}

async function manage(ctx: ToolContext, args: Record<string, unknown>, method: "GET" | "DELETE") {
  const link = requireLink(ctx, str(args, "url"));
  const token = requireToken(str(args, "manage_token"));
  try {
    return await apiJson<ManageStatusResponse>(ctx.api, `/api/manage/${link.kind}/${encodeURIComponent(link.id)}`, {
      method,
      headers: { [MANAGE_HEADER]: token },
    });
  } catch (error) {
    if (error instanceof ApiError) throw new ToolError(manageFailure(error, method === "DELETE"));
    throw error;
  }
}

const LINK_INPUT = {
  type: "object",
  additionalProperties: false,
  properties: {
    url: {
      type: "string",
      minLength: 1,
      maxLength: 8192,
      description: "The ProtectedShare link: a note, EnvShare, file drop or secret request link. Only its type and ID are sent; the part after '#' is not.",
    },
    manage_token: {
      type: "string",
      minLength: 16,
      maxLength: 256,
      pattern: "^[A-Za-z0-9_-]+$",
      description: "The manage_token returned when the link was created.",
    },
  },
  required: ["url", "manage_token"],
} as const;

const STATUS_OUTPUT = {
  type: "object",
  properties: {
    kind: { type: "string", enum: ["note", "secret", "drop", "request"] },
    id: { type: "string" },
    status: { type: "string", enum: ["active", "consumed", "expired", "revoked"] },
    reads: { type: "integer", description: "Opens, started downloads, or 1 once a request is answered." },
    max_reads: { anyOf: [{ type: "integer" }, { type: "null" }] },
    reads_remaining: { anyOf: [{ type: "integer" }, { type: "null" }] },
    created_at: { type: "string" },
    expires_at: { type: "string" },
    first_read_at: { anyOf: [{ type: "string" }, { type: "null" }] },
    last_read_at: { anyOf: [{ type: "string" }, { type: "null" }] },
    summary: { type: "string" },
  },
  required: ["kind", "id", "status", "reads", "max_reads", "reads_remaining", "created_at", "expires_at", "first_read_at", "last_read_at", "summary"],
} as const;

export const checkLinkStatus: ToolDefinition = {
  name: "check_link_status",
  title: "Check link status",
  modes: ["remote", "local"],
  description: () =>
    "Check a ProtectedShare link you created: whether it has been opened, how many reads are left, whether a secret request has been answered, and when it expires. Needs the link and the manage_token returned when it was created. Only the link's type and ID are sent, never the part after '#'. Never returns the secret itself.",
  inputSchema: () => LINK_INPUT,
  outputSchema: STATUS_OUTPUT,
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  async handler(args, ctx) {
    try {
      return ok(statusData(await manage(ctx, args, "GET")));
    } catch (error) {
      if (error instanceof ToolError) return fail(error.message);
      throw error;
    }
  },
};

export const revokeLink: ToolDefinition = {
  name: "revoke_link",
  title: "Revoke link",
  modes: ["remote", "local"],
  description: () =>
    "Revoke a ProtectedShare link you created: its encrypted content is deleted from the server right away, so the link no longer opens. Works for notes, EnvShare links, file drops and secret requests. Needs the link and its manage_token. Revoking a link that is already revoked or used up changes nothing.",
  inputSchema: () => LINK_INPUT,
  outputSchema: {
    ...STATUS_OUTPUT,
    properties: { ...STATUS_OUTPUT.properties, revoked: { type: "boolean", description: "True when the link is now revoked." } },
    required: [...STATUS_OUTPUT.required, "revoked"],
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
  async handler(args, ctx) {
    try {
      const status = await manage(ctx, args, "DELETE");
      return ok({ ...statusData(status), revoked: status.status === "revoked" });
    } catch (error) {
      if (error instanceof ToolError) return fail(error.message);
      throw error;
    }
  },
};
