/**
 * The one way the tools reach ProtectedShare's storage API.
 *
 * Callers pass an `ApiFetch`: the Worker uses a Service Binding (or a base URL), the local
 * server uses `fetch` against https://protectedshare.me. Bodies sent through here are
 * ciphertext, hashes and tokens only. Nothing in this file logs.
 */
import type { AUTH_TOKEN_HEADER, MANAGE_TOKEN_HEADER } from "@protectedshare/contracts";

/** Sends one request to the storage API. `path` always starts with "/api/". */
export type ApiFetch = (path: string, init: RequestInit) => Promise<Response>;

export const AUTH_HEADER: typeof AUTH_TOKEN_HEADER = "X-Auth-Token";
export const MANAGE_HEADER: typeof MANAGE_TOKEN_HEADER = "X-Manage-Token";

const JSON_HEADERS = { "Content-Type": "application/json", Accept: "application/json" } as const;

/**
 * No single API call should take longer than this. Opening a link makes two calls, which keeps
 * a slow worst case under the 60-second request timeout MCP clients commonly use.
 */
const TIMEOUT_MS = 25_000;

export type ApiFailure =
  | "network"
  | "timeout"
  | "not_found"
  | "unauthorized"
  | "conflict"
  | "rate_limited"
  | "too_large"
  | "rejected"
  | "server";

/** A non-2xx answer or a transport failure. The message is fixed and never carries request data. */
export class ApiError extends Error {
  readonly failure: ApiFailure;
  readonly status: number;
  /** The API's `code` field (e.g. "NOTE_NOT_FOUND"), when it sent one. */
  readonly code: string | null;
  readonly retryAfterSeconds: number | null;

  constructor(failure: ApiFailure, status: number, code: string | null, retryAfterSeconds: number | null) {
    super(`ProtectedShare API request failed (${failure})`);
    this.name = "ApiError";
    this.failure = failure;
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function failureFor(status: number): ApiFailure {
  if (status === 404) return "not_found";
  if (status === 401 || status === 403) return "unauthorized";
  if (status === 409) return "conflict";
  if (status === 429) return "rate_limited";
  if (status === 413) return "too_large";
  if (status >= 400 && status < 500) return "rejected";
  return "server";
}

function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;
  const seconds = Number.parseInt(value, 10);
  return Number.isFinite(seconds) && seconds >= 0 ? Math.min(seconds, 86_400) : null;
}

async function errorCode(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && typeof (body as { code?: unknown }).code === "string") {
      const code = (body as { code: string }).code;
      return /^[A-Z0-9_]{1,64}$/.test(code) ? code : null;
    }
  } catch {
    // Not JSON.
  }
  return null;
}

/** Calls the API and returns the parsed JSON body of a 2xx answer, or throws ApiError. */
export async function apiJson<T>(
  api: ApiFetch,
  path: string,
  options: { method?: "GET" | "POST" | "DELETE"; body?: unknown; headers?: Record<string, string> } = {}
): Promise<T> {
  let response: Response;
  try {
    response = await api(path, {
      method: options.method ?? "GET",
      headers: { ...JSON_HEADERS, ...options.headers },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    throw new ApiError(timedOut ? "timeout" : "network", 0, null, null);
  }
  if (!response.ok) {
    throw new ApiError(failureFor(response.status), response.status, await errorCode(response), parseRetryAfter(response.headers.get("retry-after")));
  }
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError("server", response.status, null, null);
  }
}

/** "Try again in 2 minutes." style hint from Retry-After, or a generic one. */
export function retryHint(error: ApiError): string {
  const seconds = error.retryAfterSeconds;
  if (seconds === null) return "Try again in a minute.";
  if (seconds < 90) return `Try again in ${Math.max(1, seconds)} seconds.`;
  return `Try again in about ${Math.ceil(seconds / 60)} minutes.`;
}

/**
 * What a failed call did. `refused`: the API turned the request down, so the outcome is known
 * (e.g. "Nothing was stored."). `unknown`: the request may have been processed before the
 * failure (network drop, timeout, 5xx), so only what is certain is said (e.g. "No link was
 * returned.").
 */
export type FailureOutcome = { refused: string; unknown: string };

/**
 * A message for failures every tool shares (network, rate limits, server errors). Tools handle
 * not_found / unauthorized themselves, since what those mean depends on the call.
 */
export function commonFailureMessage(error: ApiError, outcome: FailureOutcome): string {
  const sentences = (...parts: string[]) => parts.filter(Boolean).join(" ");
  switch (error.failure) {
    case "network":
      return sentences("Couldn't reach ProtectedShare.", outcome.unknown, "Check the network connection and try again.");
    case "timeout":
      return sentences("ProtectedShare didn't answer within 25 seconds.", outcome.unknown, "Try again in a moment.");
    case "rate_limited":
      return sentences("ProtectedShare is limiting requests right now (HTTP 429).", outcome.refused, retryHint(error));
    case "too_large":
      return sentences("That is too large for ProtectedShare to store (HTTP 413).", outcome.refused);
    case "rejected":
      return sentences(`ProtectedShare refused the request (HTTP ${error.status}${error.code ? `, ${error.code}` : ""}).`, outcome.refused);
    default:
      return sentences(`ProtectedShare's API returned an error (HTTP ${error.status || "unknown"}).`, outcome.unknown, "Try again in a moment.");
  }
}
