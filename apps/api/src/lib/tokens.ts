const encoder = new TextEncoder();

export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** SHA-256(utf8 token) as unpadded base64url. Matches `hashToken` in @protectedshare/crypto. */
export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  return bytesToBase64Url(new Uint8Array(digest));
}

/** Constant-time string comparison (time depends only on the longer length). */
export function timingSafeEqual(a: string, b: string): boolean {
  const length = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < length; i++) {
    diff |= (a.charCodeAt(i) | 0) ^ (b.charCodeAt(i) | 0);
  }
  return diff === 0;
}

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,256}$/;

/** Hashes a presented token and compares it with the stored hash in constant time. */
export async function verifyToken(presented: string | null | undefined, storedHash: string | null | undefined): Promise<boolean> {
  if (!presented || !storedHash || !TOKEN_PATTERN.test(presented)) {
    return false;
  }
  const hashed = await hashToken(presented);
  return timingSafeEqual(hashed, storedHash);
}

export function randomToken(bytes = 32): string {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}
