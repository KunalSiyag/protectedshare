/**
 * Plain constants shared by the API, the web app and the MCP servers.
 * No zod here: browser bundles import this module directly (@protectedshare/contracts/constants).
 */

/** Shortest lifetime the share forms will send. */
export const MIN_SHARE_TTL_SECONDS = 5 * 60;

/** Longest lifetime a note or secret may live. */
export const MAX_SHARE_TTL_SECONDS = 30 * 24 * 60 * 60;

export const AUTH_TOKEN_HEADER = "X-Auth-Token";

export const MANAGE_TOKEN_HEADER = "X-Manage-Token";

export const UPLOAD_TOKEN_HEADER = "X-Upload-Token";

export const DELETE_TOKEN_HEADER = "X-Delete-Token";

/** Per-download session token from POST /api/drops/:id/start. Required on chunk GETs and /consume. */
export const DOWNLOAD_TOKEN_HEADER = "X-Download-Token";

/** Plaintext cap the file-drop UI should enforce (25 MiB). */
export const MAX_DROP_PLAINTEXT_BYTES = 26_214_400;

/** Ciphertext cap the API enforces: plaintext cap + 28 bytes (12 IV + 16 tag) per chunk. */
export const MAX_DROP_TOTAL_BYTES = 26_214_400 + 40 * 28;

export const MAX_DROP_CHUNKS = 40;

/** Max size of one uploaded (encrypted) chunk body in bytes. */
export const MAX_DROP_CHUNK_BYTES = 1_100_000;

export const MAX_REQUEST_RESPONSE_BYTES = 200_000;

export const MAX_CHAT_BLOB_CHARS = 1_500_000;

export const MIN_CHAT_TTL_SECONDS = 5;

export const MAX_CHAT_TTL_SECONDS = 7 * 24 * 60 * 60;

export const MAX_MANAGE_BATCH_ITEMS = 50;

/**
 * Every 429 from the API: { error, code: "RATE_LIMITED" } plus a Retry-After header (seconds).
 * Failed key/password attempts lock a share, room or notepad for 10 minutes once they pass
 * the limit; while locked, every attempt (right or wrong) gets this 429.
 */
export const RATE_LIMITED_CODE = "RATE_LIMITED";

export const MAX_REPORT_DETAILS_CHARS = 500;

/** Header for DELETE /api/admin/:kind/:id (compared with the ADMIN_TOKEN Worker secret). */
export const ADMIN_TOKEN_HEADER = "X-Admin-Token";

/** Browsers that can watch one share. */
export const MAX_SHARE_WATCHERS = 5;

/** `#k=`, `#p=`, `#r=…&k=`, with optional whitespace around `#` and `=` (`# k = …`). */
const KEY_PARAM_FRAGMENT = /#\s*(?:[^\s#]*[&;]\s*)?[kp]\s*=/i;
/**
 * A share or chat link with anything after `#` (v1 links put the password there, legacy chat
 * `#room:password`), allowing spaces or tabs (not line breaks) on either side of the `#`.
 */
const SHARE_LINK_WITH_FRAGMENT =
  /\/(?:notes|secrets|files|request)\/[A-Za-z0-9_-]+(?:\/inbox)?\/?[^\S\r\n]*#[^\S\r\n]*\S|\/chat\/?[^\S\r\n]*#[^\S\r\n]*\S/i;

/** Decodes one level of percent-encoding. A run that isn't valid UTF-8 decodes only its ASCII escapes. */
function percentDecodeOnce(text: string): string {
  return text.replace(/(?:%[0-9A-Fa-f]{2})+/g, (run) => {
    try {
      return decodeURIComponent(run);
    } catch {
      return run.replace(/%([0-7][0-9A-Fa-f])/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
    }
  });
}

/**
 * The text as a link reads once pasted: compatibility characters folded (NFKC turns `＃ｋ＝` into
 * `#k=`), then up to three levels of percent-encoding undone (`%23k%3D`, `%2523k%253D`), then
 * folded again in case the escapes spelled full-width characters.
 */
function normalizeForKeyCheck(text: string): string {
  let current = text.normalize("NFKC");
  for (let round = 0; round < 3; round++) {
    const decoded = percentDecodeOnce(current);
    if (decoded === current) break;
    current = decoded;
  }
  return current.normalize("NFKC");
}

function hasKeyPattern(text: string): boolean {
  return KEY_PARAM_FRAGMENT.test(text) || SHARE_LINK_WITH_FRAGMENT.test(text);
}

/**
 * True if `text` holds a link key: a fragment with k= or p= (#k=…, #p=…, #r=…&k=…), or a share/chat
 * link with any fragment, as typed or once normalized (full-width, percent-encoded or spaced out).
 * Reports must never carry one; POST /api/reports rejects them with KEY_IN_REPORT.
 */
export function containsLinkKey(text: string): boolean {
  return hasKeyPattern(text) || hasKeyPattern(normalizeForKeyCheck(text));
}
