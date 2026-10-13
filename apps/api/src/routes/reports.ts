import { Hono } from "hono";
import {
  CreateReportRequestSchema,
  ShareKindSchema,
  containsLinkKey,
  type AdminTakedownResponse,
  type CreateReportRequest,
  type CreateReportResponse,
  type ShareKind,
} from "@protectedshare/contracts";
import { type AppEnv, type Bindings, createId, isValidId, jsonError, notifyEmail, nowEpochSeconds, readJsonBody } from "../lib/env";
import { deleteDropObjects } from "../lib/drop-storage";
import { escapeHtml, singleLine } from "../lib/inquiries";
import { createFloodGuard, limit, withinLimit } from "../lib/limits";
import { hashToken, timingSafeEqual } from "../lib/tokens";
import { inBackground } from "../lib/usage";
import { deleteShareContent } from "./manage";

export const reportsRoutes = new Hono<AppEnv>();

/** The admin token must be at least this long, or the takedown route stays switched off. */
const MIN_ADMIN_TOKEN_CHARS = 32;

const CONTENT_TABLE: Record<ShareKind, string> = { note: "notes", secret: "secrets", drop: "drops", request: "requests" };
const PAGE_PATH: Record<ShareKind, string> = { note: "/notes", secret: "/secrets", drop: "/files", request: "/request" };

function optionalText(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

async function emailReport(env: Bindings, report: CreateReportRequest & { reportId: string; live: boolean }): Promise<void> {
  if (!env.RESEND_API_KEY) return;
  const { kind, id, reason, details, contact, reportId, live } = report;
  const html = `
    <h2>Abuse report</h2>
    <p><strong>Share:</strong> ${escapeHtml(kind)} <code>${escapeHtml(id)}</code> (page ${escapeHtml(PAGE_PATH[kind])}/${escapeHtml(id)})</p>
    <p><strong>Reason:</strong> ${escapeHtml(reason)}</p>
    <p><strong>Still on the server:</strong> ${live ? "yes" : "no (already opened, expired, or revoked)"}</p>
    <p><strong>Contact:</strong> ${escapeHtml(contact ?? "Not provided")}</p>
    <p><strong>Details:</strong></p>
    <blockquote style="background: #f4f4f5; border-left: 4px solid #a1a1aa; padding: 10px; margin: 10px 0;">
      ${details ? escapeHtml(details).replace(/\n/g, "<br>") : "None"}
    </blockquote>
    <p>Take it down: <code>DELETE /api/admin/${escapeHtml(kind)}/${escapeHtml(id)}</code> with header <code>X-Admin-Token</code>.</p>
    <hr />
    <p style="font-size: 11px; color: #71717a;">Stored in D1 (abuse_reports) with ID: <strong>${escapeHtml(reportId)}</strong></p>
  `;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.RESEND_API_KEY}` },
      body: JSON.stringify({
        ...notifyEmail(env, "reports", "ProtectedShare Reports"),
        subject: singleLine(`Abuse report (${reason}): ${kind} ${id}`),
        html,
      }),
    });
  } catch (error) {
    console.error("Failed to email an abuse report:", error);
  }
}

/**
 * POST /api/reports: a recipient flags a share. Identified by kind + id only; a report that
 * carries a link key (#k=, #p=) is refused so a key never reaches our database or inbox.
 */
reportsRoutes.post("/api/reports", async (c) => {
  const db = c.env.DB;
  const flooded = await createFloodGuard(c);
  if (flooded) return flooded;
  const read = await readJsonBody(c, 8_000);
  if (!read.ok) return read.response;

  const raw = (read.body && typeof read.body === "object" ? read.body : {}) as Record<string, unknown>;
  // Checked before validation so a key is never stored or echoed back, whatever else is wrong.
  if ([raw.details, raw.contact].some((value) => typeof value === "string" && containsLinkKey(value))) {
    return jsonError(
      "Remove the link's key (the part after #) from your report. We only need the page it's on.",
      "KEY_IN_REPORT",
      400,
    );
  }
  const parsed = CreateReportRequestSchema.safeParse({ ...raw, details: optionalText(raw.details), contact: optionalText(raw.contact) });
  if (!parsed.success) {
    return jsonError("Choose a reason, keep details under 500 characters, and check the email address.", "INVALID_REPORT", 400);
  }
  const report = parsed.data;

  const limited = await limit(c, "RL_REPORT", `report:${report.kind}:${report.id}`, "This link was just reported. Thank you, one report is enough.");
  if (limited) return limited;

  const reportId = createId(16);
  const createdAt = nowEpochSeconds();
  try {
    await db.prepare(
      `INSERT INTO abuse_reports (id, kind, target_id, reason, details, contact, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(reportId, report.kind, report.id, report.reason, report.details ?? null, report.contact ?? null, createdAt)
      .run();
  } catch (error) {
    console.error("Failed to save abuse report:", error);
    return jsonError("Couldn't save the report. Try again in a moment.", "DATABASE_ERROR", 500);
  }

  // Every report is stored; email is capped so a flood of reports can't flood the inbox.
  if (c.env.RESEND_API_KEY && (await withinLimit(c.env, "RL_REPORT", "report-email"))) {
    const live = await db.prepare(`SELECT 1 AS live FROM ${CONTENT_TABLE[report.kind]} WHERE id = ?`)
      .bind(report.id)
      .first<{ live: number }>()
      .catch(() => null);
    inBackground(c, emailReport(c.env, { ...report, reportId, live: !!live }));
  }

  const response: CreateReportResponse = { id: reportId, received: true };
  return c.json(response, 201);
});

/** Compares two secrets in constant time (hashing first evens out their lengths). */
async function sameSecret(presented: string, configured: string): Promise<boolean> {
  const [a, b] = await Promise.all([hashToken(presented), hashToken(configured)]);
  return timingSafeEqual(a, b);
}

/**
 * DELETE /api/admin/:kind/:id (X-Admin-Token): takes a share down. Deletes the content and any
 * R2 objects, and marks an active receipt revoked so the sender sees it in "My links".
 * The route doesn't exist (404) unless the ADMIN_TOKEN secret is set.
 */
reportsRoutes.delete("/api/admin/:kind/:id", async (c) => {
  const configured = c.env.ADMIN_TOKEN?.trim() ?? "";
  if (configured.length < MIN_ADMIN_TOKEN_CHARS) {
    if (configured) console.warn(`ADMIN_TOKEN is shorter than ${MIN_ADMIN_TOKEN_CHARS} characters; admin routes stay off.`);
    return c.notFound();
  }
  const presented = c.req.header("x-admin-token")?.trim() ?? "";
  if (!presented || !(await sameSecret(presented, configured))) {
    return jsonError("Invalid admin token.", "INVALID_ADMIN_TOKEN", 401);
  }

  const kind = ShareKindSchema.safeParse(c.req.param("kind"));
  const id = c.req.param("id");
  if (!kind.success || !isValidId(id)) {
    return jsonError("Use /api/admin/<note|secret|drop|request>/<id>.", "INVALID_TARGET", 400);
  }

  const deleted = await deleteShareContent(c.env, kind.data, id, null);
  // Objects can outlive their row (a delete that failed halfway): clear them either way.
  if (kind.data === "drop" && !deleted) await deleteDropObjects(c.env, [{ id }]);
  const now = nowEpochSeconds();
  const receipt = await c.env.DB.prepare(
    "UPDATE share_receipts SET status = 'revoked', updated_at = ? WHERE kind = ? AND id = ? AND status = 'active'"
  )
    .bind(now, kind.data, id)
    .run();
  console.log(`Admin takedown: ${kind.data} ${id} (content deleted: ${deleted})`);

  const response: AdminTakedownResponse = {
    kind: kind.data,
    id,
    deleted,
    receiptRevoked: (receipt.meta?.changes ?? 0) > 0,
  };
  return c.json(response);
});
