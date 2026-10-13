/**
 * Web Push sender built on WebCrypto only (no dependency):
 * - RFC 8291 message encryption, aes128gcm content coding (RFC 8188), a single record.
 * - RFC 8292 VAPID: an ES256 JWT for the push service's origin, plus our public key.
 *
 * Pure module: no Worker bindings, so Node can load it for the RFC test vectors.
 */
import { bytesToBase64Url } from "./tokens";

const encoder = new TextEncoder();

/** Record size advertised in the RFC 8188 header. One record holds the whole (small) payload. */
const RECORD_SIZE = 4096;
const TAG_LENGTH = 16;
const SALT_LENGTH = 16;
const PUBLIC_KEY_LENGTH = 65;
const AUTH_SECRET_LENGTH = 16;
/** salt (16) + record size (4) + key id length (1) + sender public key (65). */
const HEADER_LENGTH = SALT_LENGTH + 4 + 1 + PUBLIC_KEY_LENGTH;
/** RFC 8292 allows at most 24 hours; 12 keeps every push service happy. */
const VAPID_JWT_TTL_SECONDS = 12 * 60 * 60;
const BASE64_URL = /^[A-Za-z0-9_-]*={0,2}$/;

/** A browser's PushSubscription keys, base64url as PushSubscription.toJSON() gives them. */
export type PushSubscriptionKeys = { p256dh: string; auth: string };
export type PushTarget = PushSubscriptionKeys & { endpoint: string };
/** VAPID_PUBLIC_KEY is the uncompressed P-256 point, VAPID_PRIVATE_KEY the JWK `d`; both base64url. */
export type VapidConfig = { publicKey: string; privateKey: string; subject: string };

export type EncryptOptions = {
  /** Fixed salt and sender key pair, for test vectors only. Random per message otherwise. */
  salt?: Uint8Array<ArrayBuffer>;
  senderKeys?: { privateKey: CryptoKey; publicKey: Uint8Array<ArrayBuffer> };
  /** Pad the plaintext to this many bytes so payload size says nothing about the content. */
  padTo?: number;
};

export type SendOptions = {
  /** Seconds the push service may hold the message for an offline device. */
  ttl?: number;
  urgency?: "very-low" | "low" | "normal" | "high";
  padTo?: number;
  timeoutMs?: number;
  /** Injected in tests. */
  fetcher?: typeof fetch;
};

export type PushResult = {
  ok: boolean;
  status: number;
  /** 404/410: the subscription no longer exists and should be forgotten. */
  gone: boolean;
};

/** Decodes base64url (padding optional). Throws on anything else. */
export function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  if (!BASE64_URL.test(value)) throw new Error("Not base64url.");
  const normalized = value.replace(/=+$/, "").replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized + "=".repeat((4 - (normalized.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function concat(...parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/** An uncompressed P-256 point (0x04 || X || Y). */
function decodePublicKey(value: string): Uint8Array<ArrayBuffer> {
  const bytes = base64UrlToBytes(value);
  if (bytes.length !== PUBLIC_KEY_LENGTH || bytes[0] !== 0x04) throw new Error("Expected an uncompressed P-256 public key.");
  return bytes;
}

function decodeAuthSecret(value: string): Uint8Array<ArrayBuffer> {
  const bytes = base64UrlToBytes(value);
  if (bytes.length !== AUTH_SECRET_LENGTH) throw new Error("Expected a 16-byte auth secret.");
  return bytes;
}

async function importEcdhPublicKey(raw: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", raw, { name: "ECDH", namedCurve: "P-256" }, false, []);
}

/** True when `keys` are a well-formed p256dh point on P-256 and a 16-byte auth secret. */
export async function isValidSubscriptionKeys(keys: PushSubscriptionKeys): Promise<boolean> {
  try {
    decodeAuthSecret(keys.auth);
    await importEcdhPublicKey(decodePublicKey(keys.p256dh));
    return true;
  } catch {
    return false;
  }
}

async function hkdf(salt: Uint8Array<ArrayBuffer>, ikm: Uint8Array<ArrayBuffer>, info: Uint8Array<ArrayBuffer>, length: number) {
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, length * 8);
  return new Uint8Array(bits);
}

async function generateSenderKeys(): Promise<{ privateKey: CryptoKey; publicKey: Uint8Array<ArrayBuffer> }> {
  const pair = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"])) as CryptoKeyPair;
  const publicKey = new Uint8Array((await crypto.subtle.exportKey("raw", pair.publicKey)) as ArrayBuffer);
  return { privateKey: pair.privateKey, publicKey };
}

/**
 * RFC 8291 §3.4 + RFC 8188: returns the full request body (86-byte header, then one
 * AES-128-GCM record). Only the subscribing browser can decrypt it; the push service can't.
 */
export async function encryptPushPayload(
  keys: PushSubscriptionKeys,
  plaintext: Uint8Array,
  options: EncryptOptions = {},
): Promise<Uint8Array<ArrayBuffer>> {
  const uaPublic = decodePublicKey(keys.p256dh);
  const authSecret = decodeAuthSecret(keys.auth);
  const sender = options.senderKeys ?? (await generateSenderKeys());
  if (sender.publicKey.length !== PUBLIC_KEY_LENGTH) throw new Error("Sender key must be an uncompressed P-256 point.");

  const ecdhSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      // `public` is the standard member; workers-types spells it `$public`.
      { name: "ECDH", public: await importEcdhPublicKey(uaPublic) } as unknown as EcdhKeyDeriveParams,
      sender.privateKey,
      256,
    ),
  );
  // IKM = HKDF(auth_secret, ecdh_secret, "WebPush: info" || 0x00 || ua_public || as_public, 32)
  const keyInfo = concat(encoder.encode("WebPush: info\0"), uaPublic, sender.publicKey);
  const ikm = await hkdf(authSecret, ecdhSecret, keyInfo, 32);

  const salt = options.salt ?? crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  if (salt.length !== SALT_LENGTH) throw new Error("Salt must be 16 bytes.");
  const cek = await hkdf(salt, ikm, encoder.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, encoder.encode("Content-Encoding: nonce\0"), 12);

  // Last (only) record: plaintext, the 0x02 delimiter, then zero padding.
  const padding = Math.max(0, (options.padTo ?? 0) - plaintext.length);
  const record = new Uint8Array(plaintext.length + 1 + padding);
  record.set(plaintext);
  record[plaintext.length] = 0x02;
  if (record.length + TAG_LENGTH > RECORD_SIZE) throw new Error("Push payload is too large for one record.");

  const aesKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, record));

  const header = new Uint8Array(HEADER_LENGTH);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(SALT_LENGTH, RECORD_SIZE);
  header[SALT_LENGTH + 4] = PUBLIC_KEY_LENGTH;
  header.set(sender.publicKey, SALT_LENGTH + 5);
  return concat(header, ciphertext);
}

const signingKeys = new Map<string, Promise<CryptoKey>>();

/** Imports the VAPID private key once per isolate (JWK built from the public point + `d`). */
function vapidSigningKey(vapid: VapidConfig): Promise<CryptoKey> {
  const cacheKey = `${vapid.publicKey}:${vapid.privateKey}`;
  let key = signingKeys.get(cacheKey);
  if (!key) {
    const point = decodePublicKey(vapid.publicKey);
    key = crypto.subtle.importKey(
      "jwk",
      {
        kty: "EC",
        crv: "P-256",
        x: bytesToBase64Url(point.slice(1, 33)),
        y: bytesToBase64Url(point.slice(33, 65)),
        d: vapid.privateKey,
        ext: false,
      },
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["sign"],
    );
    key.catch(() => signingKeys.delete(cacheKey));
    signingKeys.set(cacheKey, key);
  }
  return key;
}

function base64UrlJson(value: unknown): string {
  return bytesToBase64Url(encoder.encode(JSON.stringify(value)));
}

/**
 * RFC 8292 `Authorization` header: `vapid t=<ES256 JWT>, k=<public key>`. The JWT's audience is
 * the push service's origin, so a token can't be replayed against another service.
 */
export async function vapidAuthorization(endpoint: string, vapid: VapidConfig, nowSeconds = Math.floor(Date.now() / 1000)): Promise<string> {
  const unsigned = `${base64UrlJson({ typ: "JWT", alg: "ES256" })}.${base64UrlJson({
    aud: new URL(endpoint).origin,
    exp: nowSeconds + VAPID_JWT_TTL_SECONDS,
    sub: vapid.subject,
  })}`;
  // WebCrypto ECDSA signatures are IEEE P1363 (r || s), which is exactly what JWS ES256 wants.
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, await vapidSigningKey(vapid), encoder.encode(unsigned));
  return `vapid t=${unsigned}.${bytesToBase64Url(new Uint8Array(signature))}, k=${vapid.publicKey}`;
}

/** Encrypts `payload` for one subscription and POSTs it to the subscription's push service. */
export async function sendWebPush(target: PushTarget, payload: string, vapid: VapidConfig, options: SendOptions = {}): Promise<PushResult> {
  const body = await encryptPushPayload(target, encoder.encode(payload), { padTo: options.padTo });
  const response = await (options.fetcher ?? fetch)(target.endpoint, {
    method: "POST",
    headers: {
      Authorization: await vapidAuthorization(target.endpoint, vapid),
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: String(options.ttl ?? 86_400),
      Urgency: options.urgency ?? "normal",
    },
    body,
    // Never follow a redirect away from the allow-listed push service.
    redirect: "manual",
    signal: AbortSignal.timeout(options.timeoutMs ?? 10_000),
  });
  await response.body?.cancel().catch(() => undefined);
  return { ok: response.ok, status: response.status, gone: response.status === 404 || response.status === 410 };
}
