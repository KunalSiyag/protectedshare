/**
 * JSON Web Token decoding and HMAC verification, all in the browser.
 * Decoding is just base64url + JSON: it proves nothing about who made the token. Only a signature
 * check with the right key does, and this file can do that for HS256, HS384 and HS512.
 */

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type JsonObject = { [key: string]: Json };

export type DecodedPart = {
  raw: string;
  /** Parsed JSON object, when the part decodes cleanly. */
  json: JsonObject | null;
  /** Decoded text, when it is UTF-8 but not a JSON object. */
  text: string | null;
  error: string | null;
};

export type DecodedToken =
  | {
      kind: "jws";
      header: DecodedPart;
      payload: DecodedPart;
      signature: { raw: string; bytes: Uint8Array | null };
      /** header.payload exactly as it appeared in the token: what the signature covers. */
      signingInput: string;
      /** Two parts only: the signature segment is missing altogether. */
      missingSignature: boolean;
    }
  | { kind: "jwe"; header: DecodedPart; partCount: 5 }
  | { kind: "invalid"; message: string };

/** Trim, drop a "Bearer " prefix and wrapping quotes, and remove all whitespace and line breaks. */
export function cleanToken(input: string): string {
  return input
    .trim()
    .replace(/^bearer\s+/i, "")
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\s+/g, "");
}

/** base64url (or plain base64) to bytes. Padding is optional. */
export function decodeBase64Url(segment: string): Uint8Array {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/").replace(/=+$/, "");
  if (!/^[A-Za-z0-9+/]*$/.test(normalized) || normalized.length % 4 === 1) {
    throw new Error("Not base64url.");
  }
  const binary = atob(normalized + "===".slice((normalized.length + 3) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodePart(raw: string, name: "header" | "payload"): DecodedPart {
  let bytes: Uint8Array;
  try {
    bytes = decodeBase64Url(raw);
  } catch {
    return { raw, json: null, text: null, error: `The ${name} isn't valid base64url.` };
  }
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return { raw, json: null, text: null, error: `The ${name} isn't UTF-8 text.` };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { raw, json: null, text, error: `The ${name} isn't valid JSON.` };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { raw, json: null, text, error: `The ${name} should be a JSON object.` };
  }
  return { raw, json: parsed as JsonObject, text, error: null };
}

export function decodeToken(input: string): DecodedToken | null {
  const token = cleanToken(input);
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length === 5) {
    return { kind: "jwe", header: decodePart(parts[0], "header"), partCount: 5 };
  }
  if (parts.length !== 3 && parts.length !== 2) {
    return {
      kind: "invalid",
      message:
        parts.length === 1
          ? "A JWT has three parts separated by dots. This has none."
          : `A JWT has three parts separated by dots. This has ${parts.length}.`,
    };
  }
  if (!parts[0] || !parts[1]) {
    return { kind: "invalid", message: "The header or payload part is empty." };
  }
  const signatureRaw = parts[2] ?? "";
  let signatureBytes: Uint8Array | null = null;
  try {
    signatureBytes = decodeBase64Url(signatureRaw);
  } catch {
    signatureBytes = null;
  }
  return {
    kind: "jws",
    header: decodePart(parts[0], "header"),
    payload: decodePart(parts[1], "payload"),
    signature: { raw: signatureRaw, bytes: signatureBytes },
    signingInput: `${parts[0]}.${parts[1]}`,
    missingSignature: parts.length === 2,
  };
}

/* ───────────────────────── Claims and warnings ───────────────────────── */

export type Note = { tone: "danger" | "warn" | "info"; text: string };

export const HMAC_ALGS = { HS256: "SHA-256", HS384: "SHA-384", HS512: "SHA-512" } as const;
export type HmacAlg = keyof typeof HMAC_ALGS;

export function isHmacAlg(alg: unknown): alg is HmacAlg {
  return typeof alg === "string" && alg in HMAC_ALGS;
}

/** Signature sizes that don't depend on the key: HMAC output and raw ECDSA r||s. */
const FIXED_SIGNATURE_BYTES: Record<string, number> = { HS256: 32, HS384: 48, HS512: 64, ES256: 64, ES384: 96, ES512: 132 };

export function headerNotes(token: Extract<DecodedToken, { kind: "jws" }>): Note[] {
  const notes: Note[] = [];
  const header = token.header.json;
  if (!header) return notes;
  const alg = header.alg;
  const hasSignature = token.signature.raw.length > 0;
  if (typeof alg !== "string" || !alg) {
    notes.push({ tone: "danger", text: "The header has no alg, so there's no way to know how it was signed." });
  } else if (alg.toLowerCase() === "none") {
    notes.push({
      tone: "danger",
      text: "alg is none: the token is unsigned, so anyone can write one. A server must reject it.",
    });
  } else {
    if (!hasSignature) notes.push({ tone: "danger", text: `The header says ${alg}, but the signature part is empty.` });
    if (token.signature.raw && !token.signature.bytes) {
      notes.push({ tone: "warn", text: "The signature part isn't valid base64url." });
    }
    const expected = FIXED_SIGNATURE_BYTES[alg];
    if (expected && token.signature.bytes && token.signature.bytes.length > 0 && token.signature.bytes.length !== expected) {
      notes.push({
        tone: "warn",
        text: `${alg} signatures are ${expected} bytes; this one is ${token.signature.bytes.length}. It won't verify.`,
      });
    }
    if (isHmacAlg(alg)) {
      notes.push({
        tone: "info",
        text: `${alg} is HMAC: one shared secret both signs and verifies, so anything that can check this token can also mint one.`,
      });
    }
  }
  if (typeof header.jku === "string" || typeof header.x5u === "string") {
    notes.push({
      tone: "warn",
      text: "The header points to a key URL (jku or x5u). A server should only fetch keys from addresses it already trusts.",
    });
  }
  if (header.jwk !== undefined) {
    notes.push({
      tone: "warn",
      text: "The header carries its own key (jwk). A server must never verify a token with a key the token brings.",
    });
  }
  return notes;
}

export const TIME_CLAIMS = ["exp", "nbf", "iat", "auth_time"] as const;
export type TimeClaim = (typeof TIME_CLAIMS)[number];

export function isTimeClaim(name: string): name is TimeClaim {
  return (TIME_CLAIMS as readonly string[]).includes(name);
}

export const CLAIM_LABELS: Record<string, string> = {
  iss: "Issuer",
  sub: "Subject",
  aud: "Audience",
  exp: "Expires",
  nbf: "Not valid before",
  iat: "Issued at",
  jti: "Token ID",
  auth_time: "Signed in at",
  azp: "Authorized party",
  scope: "Scopes",
  scp: "Scopes",
  sid: "Session ID",
  nonce: "Nonce",
  name: "Name",
  email: "Email",
  email_verified: "Email verified",
  preferred_username: "Username",
  given_name: "Given name",
  family_name: "Family name",
  roles: "Roles",
  groups: "Groups",
  client_id: "Client ID",
  tid: "Tenant ID",
  acr: "Auth context",
  amr: "Auth methods",
  typ: "Type",
  alg: "Algorithm",
  kid: "Key ID",
  cty: "Content type",
};

/** Seconds since 1970 that look like milliseconds (after the year 5138 if read as seconds). */
export function looksLikeMilliseconds(value: number): boolean {
  return value > 1e11;
}

export type Validity = {
  expired: boolean;
  notYetValid: boolean;
  exp: number | null;
  nbf: number | null;
};

/** Time checks against `nowSeconds`. Only numeric claims count; anything else is flagged by payloadNotes. */
export function validity(payload: JsonObject | null, nowSeconds: number): Validity {
  const exp = typeof payload?.exp === "number" ? payload.exp : null;
  const nbf = typeof payload?.nbf === "number" ? payload.nbf : null;
  return {
    exp,
    nbf,
    expired: exp !== null && !looksLikeMilliseconds(exp) && nowSeconds >= exp,
    notYetValid: nbf !== null && !looksLikeMilliseconds(nbf) && nowSeconds < nbf,
  };
}

export function payloadNotes(payload: JsonObject | null, nowSeconds: number): Note[] {
  const notes: Note[] = [];
  if (!payload) return notes;
  for (const name of TIME_CLAIMS) {
    const value = payload[name];
    if (value === undefined) continue;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      notes.push({ tone: "warn", text: `${name} should be a number of seconds since 1970, not ${typeof value === "string" ? "a string" : String(typeof value)}.` });
    } else if (looksLikeMilliseconds(value)) {
      notes.push({
        tone: "warn",
        text: `${name} looks like milliseconds. JWT times are seconds since 1970, so most libraries will read it as a date thousands of years away.`,
      });
    }
  }
  if (payload.exp === undefined) {
    notes.push({ tone: "info", text: "No exp claim: the token doesn't expire on its own. The server has to decide when to stop accepting it." });
  }
  if (typeof payload.iat === "number" && !looksLikeMilliseconds(payload.iat) && payload.iat > nowSeconds + 300) {
    notes.push({ tone: "warn", text: "iat is in the future. The issuer's clock may be off." });
  }
  return notes;
}

/* ───────────────────────── HMAC verification ───────────────────────── */

export type SecretEncoding = "text" | "base64";

export function secretBytes(secret: string, encoding: SecretEncoding): Uint8Array {
  if (encoding === "text") return new TextEncoder().encode(secret);
  return decodeBase64Url(secret.replace(/\s+/g, ""));
}

/** True when the signature matches. Throws if the key can't be used (empty, or not valid base64). */
export async function verifyHmac(
  alg: HmacAlg,
  signingInput: string,
  signature: Uint8Array,
  key: Uint8Array
): Promise<boolean> {
  if (key.length === 0) throw new Error("The secret is empty.");
  const cryptoKey = await crypto.subtle.importKey("raw", new Uint8Array(key), { name: "HMAC", hash: HMAC_ALGS[alg] }, false, ["verify"]);
  return crypto.subtle.verify("HMAC", cryptoKey, new Uint8Array(signature), new TextEncoder().encode(signingInput));
}

/** HS256-sign a header and payload. Used to build the example token in the page. */
export async function signHs256(header: JsonObject, payload: JsonObject, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const input = `${encodeBase64Url(encoder.encode(JSON.stringify(header)))}.${encodeBase64Url(encoder.encode(JSON.stringify(payload)))}`;
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(input)));
  return `${input}.${encodeBase64Url(signature)}`;
}
