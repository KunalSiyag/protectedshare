import { MAX_DROP_CHUNKS } from "@protectedshare/contracts";
import type { Bindings } from "./env";
import { isValidId } from "./env";

/**
 * File-drop chunk bytes live in R2 when the DROPS_BUCKET binding exists, under
 * `drops/<dropId>/<idx>`. D1 keeps one drop_chunks row per chunk with its size (the upload
 * budget and /complete check run on it) and an empty BLOB in the legacy `data` column.
 *
 * Without the binding (self-hosting without R2) chunks are stored in D1 as before. Rows
 * written before R2 existed have `size` NULL and their bytes in `data`; reads fall back to them.
 * A row whose `data` is empty is R2-backed.
 */

const PREFIX = "drops/";
/** R2 deletes at most 1,000 keys per call. */
const DELETE_BATCH = 1000;

export function dropBucket(env: Bindings): R2Bucket | null {
  const bucket = env.DROPS_BUCKET;
  return bucket && typeof bucket.put === "function" ? bucket : null;
}

export function dropChunkKey(dropId: string, idx: number): string {
  return `${PREFIX}${dropId}/${idx}`;
}

export function dropChunkPrefix(dropId: string): string {
  return `${PREFIX}${dropId}/`;
}

/**
 * Deletes every chunk object of the given drops (all possible indexes when the count isn't
 * known). Never throws: whatever is left behind, the cron sweep removes.
 */
export async function deleteDropObjects(env: Bindings, drops: Array<{ id: string; chunkCount?: number | null }>): Promise<void> {
  const bucket = dropBucket(env);
  if (!bucket || drops.length === 0) return;
  const keys = drops.flatMap(({ id, chunkCount }) => {
    const count = Math.min(MAX_DROP_CHUNKS, Math.max(1, chunkCount ?? MAX_DROP_CHUNKS));
    return Array.from({ length: count }, (_, idx) => dropChunkKey(id, idx));
  });
  for (let start = 0; start < keys.length; start += DELETE_BATCH) {
    try {
      await bucket.delete(keys.slice(start, start + DELETE_BATCH));
    } catch (error) {
      console.error("Failed to delete drop objects from R2:", error);
    }
  }
}

/**
 * Removes chunk objects whose drop row is gone (deleted while an upload was still writing,
 * or a delete that failed). Walks `drops/<id>/` prefixes a page at a time.
 */
export async function sweepOrphanDropObjects(env: Bindings, maxPages = 10): Promise<number> {
  const bucket = dropBucket(env);
  if (!bucket) return 0;
  let cursor: string | undefined;
  let removed = 0;
  for (let page = 0; page < maxPages; page++) {
    const listing = await bucket.list({ prefix: PREFIX, delimiter: "/", cursor, limit: 1000 });
    const ids = listing.delimitedPrefixes
      .map((prefix) => prefix.slice(PREFIX.length).replace(/\/$/, ""))
      .filter((id) => isValidId(id));
    if (ids.length > 0) {
      const { results } = await env.DB.prepare("SELECT id FROM drops WHERE id IN (SELECT value FROM json_each(?))")
        .bind(JSON.stringify(ids))
        .all<{ id: string }>();
      const live = new Set(results.map((row) => row.id));
      const orphans = ids.filter((id) => !live.has(id));
      await deleteDropObjects(env, orphans.map((id) => ({ id })));
      removed += orphans.length;
    }
    if (!listing.truncated) break;
    cursor = listing.cursor;
  }
  return removed;
}
