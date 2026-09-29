/** Turn a failed fetch into a sentence the user can act on. */
export function describeRequestFailure(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  if (error.message === "Failed to fetch") {
    return "Could not reach the server. Check your connection and try again.";
  }
  return error.message.trim() || fallback;
}

/** Read `{ error }` from the API, then fall back to a status-specific sentence. */
export async function readApiError(response: Response, fallback: string): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof data.error === "string" &&
      data.error.trim()
    ) {
      return data.error.trim();
    }
  } catch {
    // Body was empty or not JSON.
  }

  if (response.status === 429) return "Too many requests. Wait a moment, then try again.";
  if (response.status === 413) return "That is too large to store. Shorten it and try again.";
  return fallback;
}

/** Copy text, or throw a message that tells the user how to finish by hand. */
export async function copyText(value: string): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    throw new Error("Clipboard is unavailable. Select the text and copy it manually.");
  }
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    throw new Error("Could not copy automatically. Select the text and copy it manually.");
  }
}
