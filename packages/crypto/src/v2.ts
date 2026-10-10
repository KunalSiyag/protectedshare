/**
 * Crypto v2.
 *
 * Every secret is sealed with AES-256-GCM under a key derived by HKDF-SHA256 from
 * input keying material (ikm) and a per-item random salt:
 *
 *   key           ikm = 32 random bytes carried in the URL fragment
 *   password      ikm = PBKDF2-SHA256(password, salt, 600,000 iterations)
 *   key+password  ikm = key bytes ‖ PBKDF2 bytes
 *
 *   encKey    = HKDF(ikm, salt, "ps/v2/enc")
 *   authToken = HKDF(ikm, salt, "ps/v2/auth")   sent on retrieval
 *   authHash  = SHA-256(authToken)              stored by the server
 *
 * The server can check that a reader holds the secret without learning it, and a copy of
 * the database gives an attacker one salted, 600k-iteration guess per password attempt.
 */
import { WORDLIST } from "./wordlist";

export type KdfMode = "key" | "password" | "key+password";

export type SealedV2 = {
  v: 2;
  kdf: KdfMode;
  encryptedBlob: string;
  iv: string;
  salt: string;
};

export type SecretInput = { key?: string; password?: string };

export type EncryptedJson = { encryptedBlob: string; iv: string };

export const V2_PBKDF2_ITERATIONS = 600_000;
const KEY_BYTES = 32;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const INFO_ENC = "ps/v2/enc";
const INFO_AUTH = "ps/v2/auth";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function subtle(): SubtleCrypto {
  if (typeof globalThis.crypto === "undefined" || typeof globalThis.crypto.subtle === "undefined") {
    throw new Error("Web Crypto API is unavailable in the current runtime.");
  }
  return globalThis.crypto.subtle;
}

function randomBytes(length: number): Uint8Array {
  return globalThis.crypto.getRandomValues(new Uint8Array(length));
}

function buf(bytes: Uint8Array): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

export function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function fromBase64Url(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(value)) {
    throw new Error("Malformed base64url value.");
  }
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/** 32 random bytes as base64url. This is what goes in `#k=`. */
export function generateKey(): string {
  return toBase64Url(randomBytes(KEY_BYTES));
}

/** Random base64url token (manage tokens, upload tokens, delete tokens). */
export function generateToken(bytes = 32): string {
  return toBase64Url(randomBytes(bytes));
}

/** SHA-256 of the token's UTF-8 bytes, base64url. The server stores and compares this. */
export async function hashToken(token: string): Promise<string> {
  const digest = await subtle().digest("SHA-256", encoder.encode(token));
  return toBase64Url(new Uint8Array(digest));
}

function decodeKey(key: string): Uint8Array {
  const bytes = fromBase64Url(key.trim());
  if (bytes.length !== KEY_BYTES) {
    throw new Error("This link's key is incomplete. Copy the whole link, including the part after #.");
  }
  return bytes;
}

async function pbkdf2Bytes(password: string, salt: Uint8Array, iterations = V2_PBKDF2_ITERATIONS): Promise<Uint8Array> {
  // NFC so the same password typed on different keyboards/OSes (é vs e + ◌́) derives the same key.
  const base = await subtle().importKey("raw", encoder.encode(password.normalize("NFC")), "PBKDF2", false, ["deriveBits"]);
  const bits = await subtle().deriveBits(
    { name: "PBKDF2", salt: buf(salt), iterations, hash: "SHA-256" },
    base,
    256
  );
  return new Uint8Array(bits);
}

export function kdfFor(secret: SecretInput): KdfMode {
  const hasKey = Boolean(secret.key);
  const hasPassword = Boolean(secret.password);
  if (hasKey && hasPassword) return "key+password";
  if (hasKey) return "key";
  if (hasPassword) return "password";
  throw new Error("A key or a password is required.");
}

async function inputKeyMaterial(secret: SecretInput, kdf: KdfMode, salt: Uint8Array): Promise<Uint8Array> {
  if (kdf === "key") {
    if (!secret.key) throw new Error("This link needs its key. Copy the whole link, including the part after #.");
    return decodeKey(secret.key);
  }
  if (!secret.password) throw new Error("Enter the password.");
  const stretched = await pbkdf2Bytes(secret.password, salt);
  if (kdf === "password") return stretched;
  if (!secret.key) throw new Error("This link needs its key. Copy the whole link, including the part after #.");
  return concat(decodeKey(secret.key), stretched);
}

async function hkdfBase(ikm: Uint8Array): Promise<CryptoKey> {
  return subtle().importKey("raw", buf(ikm), "HKDF", false, ["deriveKey", "deriveBits"]);
}

async function hkdfAesKey(base: CryptoKey, salt: Uint8Array, info: string): Promise<CryptoKey> {
  return subtle().deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: buf(salt), info: encoder.encode(info) },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function hkdfBytes(base: CryptoKey, salt: Uint8Array, info: string, length = 32): Promise<Uint8Array> {
  const bits = await subtle().deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: buf(salt), info: encoder.encode(info) },
    base,
    length * 8
  );
  return new Uint8Array(bits);
}

type DerivedKeys = { encKey: CryptoKey; authToken: string; authHash: string };

async function deriveKeys(ikm: Uint8Array, salt: Uint8Array): Promise<DerivedKeys> {
  const base = await hkdfBase(ikm);
  const encKey = await hkdfAesKey(base, salt, INFO_ENC);
  const authToken = toBase64Url(await hkdfBytes(base, salt, INFO_AUTH));
  return { encKey, authToken, authHash: await hashToken(authToken) };
}

async function aesEncrypt(key: CryptoKey, data: Uint8Array, aad?: Uint8Array): Promise<{ iv: Uint8Array; ciphertext: Uint8Array }> {
  const iv = randomBytes(IV_BYTES);
  const params: AesGcmParams = { name: "AES-GCM", iv: buf(iv) };
  if (aad) params.additionalData = buf(aad);
  const ciphertext = new Uint8Array(await subtle().encrypt(params, key, buf(data)));
  return { iv, ciphertext };
}

async function aesDecrypt(key: CryptoKey, iv: Uint8Array, ciphertext: Uint8Array, aad?: Uint8Array): Promise<Uint8Array> {
  const params: AesGcmParams = { name: "AES-GCM", iv: buf(iv) };
  if (aad) params.additionalData = buf(aad);
  try {
    return new Uint8Array(await subtle().decrypt(params, key, buf(ciphertext)));
  } catch {
    throw new Error("Could not decrypt. The key or password is wrong, or the data was changed.");
  }
}

/* ───────────────────────── Text secrets (notes, EnvShare) ───────────────────────── */

export async function sealText(
  plaintext: string,
  secret: SecretInput
): Promise<{ payload: SealedV2; authToken: string; authHash: string }> {
  const kdf = kdfFor(secret);
  const salt = randomBytes(SALT_BYTES);
  const keys = await deriveKeys(await inputKeyMaterial(secret, kdf, salt), salt);
  const { iv, ciphertext } = await aesEncrypt(keys.encKey, encoder.encode(plaintext), encoder.encode(`ps/v2/${kdf}`));
  return {
    payload: { v: 2, kdf, encryptedBlob: toBase64Url(ciphertext), iv: toBase64Url(iv), salt: toBase64Url(salt) },
    authToken: keys.authToken,
    authHash: keys.authHash,
  };
}

/** Recompute the retrieval token from the salt the server reports in `/meta`. */
export async function deriveAuthToken(secret: SecretInput, salt: string, kdf: KdfMode): Promise<string> {
  const saltBytes = fromBase64Url(salt);
  const keys = await deriveKeys(await inputKeyMaterial(secret, kdf, saltBytes), saltBytes);
  return keys.authToken;
}

export async function openText(payload: SealedV2, secret: SecretInput): Promise<string> {
  const salt = fromBase64Url(payload.salt);
  const keys = await deriveKeys(await inputKeyMaterial(secret, payload.kdf, salt), salt);
  const plain = await aesDecrypt(
    keys.encKey,
    fromBase64Url(payload.iv),
    fromBase64Url(payload.encryptedBlob),
    encoder.encode(`ps/v2/${payload.kdf}`)
  );
  return decoder.decode(plain);
}

/* ───────────────────────── Files ───────────────────────── */

/** Derive the file-drop keys. `salt` is generated with `generateSalt()` when creating a drop. */
export async function deriveFileKeys(key: string, salt: string): Promise<DerivedKeys> {
  const saltBytes = fromBase64Url(salt);
  return deriveKeys(decodeKey(key), saltBytes);
}

export function generateSalt(): string {
  return toBase64Url(randomBytes(SALT_BYTES));
}

function chunkAad(index: number, total: number): Uint8Array {
  return encoder.encode(`ps-chunk:${index}/${total}`);
}

/** Returns iv(12) ‖ ciphertext. The chunk's position and the total count are bound as AAD. */
export async function encryptChunk(encKey: CryptoKey, bytes: Uint8Array, index: number, total: number): Promise<Uint8Array> {
  const { iv, ciphertext } = await aesEncrypt(encKey, bytes, chunkAad(index, total));
  return concat(iv, ciphertext);
}

export async function decryptChunk(encKey: CryptoKey, data: Uint8Array, index: number, total: number): Promise<Uint8Array> {
  if (data.length <= IV_BYTES) throw new Error("This file chunk is damaged.");
  return aesDecrypt(encKey, data.subarray(0, IV_BYTES), data.subarray(IV_BYTES), chunkAad(index, total));
}

export async function encryptJson(encKey: CryptoKey, value: unknown): Promise<EncryptedJson> {
  const { iv, ciphertext } = await aesEncrypt(encKey, encoder.encode(JSON.stringify(value)));
  return { encryptedBlob: toBase64Url(ciphertext), iv: toBase64Url(iv) };
}

export async function decryptJson<T = unknown>(encKey: CryptoKey, payload: EncryptedJson): Promise<T> {
  const plain = await aesDecrypt(encKey, fromBase64Url(payload.iv), fromBase64Url(payload.encryptedBlob));
  return JSON.parse(decoder.decode(plain)) as T;
}

/** Import a raw `#k=` key for direct AES-GCM use (request labels). */
export async function importRawKey(key: string): Promise<CryptoKey> {
  const base = await hkdfBase(decodeKey(key));
  return hkdfAesKey(base, new Uint8Array(SALT_BYTES), "ps/v2/label");
}

/**
 * Secret requests: the token that lets someone answer. Derived from the label key that rides
 * in the request link (`#k=`), so only a holder of the full link can respond. The server
 * stores `respondHash` and checks `X-Auth-Token` on POST /respond.
 */
export async function deriveRespondToken(labelKey: string): Promise<{ respondToken: string; respondHash: string }> {
  const base = await hkdfBase(decodeKey(labelKey));
  const respondToken = toBase64Url(await hkdfBytes(base, new Uint8Array(SALT_BYTES), "ps/v2/respond"));
  return { respondToken, respondHash: await hashToken(respondToken) };
}

/** SHA-256 of the raw public key bytes, base64url. Carried inside the encrypted request label. */
export async function publicKeyFingerprint(publicKey: string): Promise<string> {
  const digest = await subtle().digest("SHA-256", buf(fromBase64Url(publicKey)));
  return toBase64Url(new Uint8Array(digest));
}

/* ───────────────────────── Secret requests (public-key) ───────────────────────── */

const ECDH: EcKeyImportParams = { name: "ECDH", namedCurve: "P-256" };
const INFO_REQUEST = "ps/v2/request";
const INFO_INBOX = "ps/v2/inbox";

export type SealedToPublicKey = {
  ephemeralPublicKey: string;
  salt: string;
  iv: string;
  encryptedBlob: string;
};

export async function createRequestKeys(): Promise<{
  publicKey: string;
  privateKey: string;
  inboxToken: string;
  inboxHash: string;
}> {
  const pair = (await subtle().generateKey(ECDH, true, ["deriveBits"])) as CryptoKeyPair;
  const publicKey = toBase64Url(new Uint8Array(await subtle().exportKey("raw", pair.publicKey)));
  const privateKey = toBase64Url(new Uint8Array(await subtle().exportKey("pkcs8", pair.privateKey)));
  const inboxToken = await deriveInboxToken(privateKey);
  return { publicKey, privateKey, inboxToken, inboxHash: await hashToken(inboxToken) };
}

/** The inbox token is derived from the private key, so the inbox link only has to carry one value. */
export async function deriveInboxToken(privateKey: string): Promise<string> {
  const pkcs8 = fromBase64Url(privateKey);
  const base = await hkdfBase(new Uint8Array(await subtle().digest("SHA-256", buf(pkcs8))));
  return toBase64Url(await hkdfBytes(base, new Uint8Array(SALT_BYTES), INFO_INBOX));
}

async function requestKey(sharedSecret: Uint8Array, salt: Uint8Array, aad: Uint8Array): Promise<CryptoKey> {
  const base = await hkdfBase(sharedSecret);
  return subtle().deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: buf(salt), info: buf(concat(encoder.encode(INFO_REQUEST), aad)) },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function sealToPublicKey(plaintext: string, publicKey: string): Promise<SealedToPublicKey> {
  const recipientRaw = fromBase64Url(publicKey);
  const recipient = await subtle().importKey("raw", buf(recipientRaw), ECDH, false, []);
  const ephemeral = (await subtle().generateKey(ECDH, true, ["deriveBits"])) as CryptoKeyPair;
  const ephemeralRaw = new Uint8Array(await subtle().exportKey("raw", ephemeral.publicKey));
  const shared = new Uint8Array(
    await subtle().deriveBits({ name: "ECDH", public: recipient }, ephemeral.privateKey, 256)
  );
  const salt = randomBytes(SALT_BYTES);
  // Both public keys are bound into the key derivation and the ciphertext.
  const binding = concat(ephemeralRaw, recipientRaw);
  const key = await requestKey(shared, salt, binding);
  const { iv, ciphertext } = await aesEncrypt(key, encoder.encode(plaintext), binding);
  return {
    ephemeralPublicKey: toBase64Url(ephemeralRaw),
    salt: toBase64Url(salt),
    iv: toBase64Url(iv),
    encryptedBlob: toBase64Url(ciphertext),
  };
}

export async function openWithPrivateKey(sealed: SealedToPublicKey, privateKey: string, publicKey: string): Promise<string> {
  const priv = await subtle().importKey("pkcs8", buf(fromBase64Url(privateKey)), ECDH, false, ["deriveBits"]);
  const ephemeralRaw = fromBase64Url(sealed.ephemeralPublicKey);
  const ephemeral = await subtle().importKey("raw", buf(ephemeralRaw), ECDH, false, []);
  const shared = new Uint8Array(await subtle().deriveBits({ name: "ECDH", public: ephemeral }, priv, 256));
  const binding = concat(ephemeralRaw, fromBase64Url(publicKey));
  const key = await requestKey(shared, fromBase64Url(sealed.salt), binding);
  const plain = await aesDecrypt(key, fromBase64Url(sealed.iv), fromBase64Url(sealed.encryptedBlob), binding);
  return decoder.decode(plain);
}

/* ───────────────────────── Chat rooms ───────────────────────── */

export type RoomKeys = DerivedKeys & { safetyWords: string[] };

/**
 * Key rooms (`#r=…&k=…`) use the 32-byte key directly. Password rooms stretch the
 * password with PBKDF2 using a salt bound to the room id, so every member derives the
 * same keys without a server round trip.
 */
export async function deriveRoomKeys(input: { key?: string; password?: string; roomId: string }): Promise<RoomKeys> {
  const roomSalt = new Uint8Array(await subtle().digest("SHA-256", encoder.encode(`ps/v2/room:${input.roomId}`))).subarray(0, SALT_BYTES);
  let ikm: Uint8Array;
  if (input.key) {
    ikm = decodeKey(input.key);
  } else if (input.password) {
    ikm = await pbkdf2Bytes(input.password, roomSalt);
  } else {
    throw new Error("A room key or password is required.");
  }
  const keys = await deriveKeys(ikm, roomSalt);
  const base = await hkdfBase(ikm);
  const fingerprint = await hkdfBytes(base, roomSalt, "ps/v2/safety", 8);
  return { ...keys, safetyWords: fingerprintWords(fingerprint, 5) };
}

/** Words a fingerprint can map to: the first 1024 of the list, so 10 bits pick one uniformly. */
const FINGERPRINT_WORDS = 1024;

/** Map bytes to words: 10 bits per word over the first 1024 words (uniform, no modulo bias). */
export function fingerprintWords(bytes: Uint8Array, count = 5): string[] {
  if (WORDLIST.length < FINGERPRINT_WORDS) throw new Error("Word list is too short for fingerprints.");
  if (bytes.length === 0) throw new Error("No fingerprint bytes.");
  const words: string[] = [];
  let acc = 0;
  let bits = 0;
  let index = 0;
  while (words.length < count) {
    if (bits < 10) {
      acc = ((acc << 8) | (bytes[index % bytes.length] ?? 0)) & 0xffffff;
      bits += 8;
      index += 1;
      continue;
    }
    bits -= 10;
    words.push(WORDLIST[(acc >> bits) & 0x3ff]);
  }
  return words;
}

/* ───────────────────────── Generators ───────────────────────── */

/** Uniform integer in [0, max) without modulo bias. */
export function randomInt(max: number): number {
  if (!Number.isInteger(max) || max <= 0 || max > 2 ** 32) throw new Error("Invalid range.");
  const limit = Math.floor(2 ** 32 / max) * max;
  const sample = new Uint32Array(1);
  for (;;) {
    globalThis.crypto.getRandomValues(sample);
    if (sample[0] < limit) return sample[0] % max;
  }
}

export type PasswordOptions = {
  length: number;
  lower?: boolean;
  upper?: boolean;
  digits?: boolean;
  symbols?: boolean;
  avoidAmbiguous?: boolean;
};

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?/~";
const AMBIGUOUS = /[Il1O0o]/g;
/** Used when a caller passes NaN/Infinity (e.g. an empty number input). */
const DEFAULT_PASSWORD_LENGTH = 20;
const DEFAULT_PASSPHRASE_WORDS = 6;

/** Random password that contains at least one character from every selected class. */
export function generatePassword(options: PasswordOptions): { value: string; entropyBits: number } {
  const classes = [
    options.lower !== false ? LOWER : "",
    options.upper ? UPPER : "",
    options.digits ? DIGITS : "",
    options.symbols ? SYMBOLS : "",
  ]
    .map((set) => (options.avoidAmbiguous ? set.replace(AMBIGUOUS, "") : set))
    .filter(Boolean);
  if (classes.length === 0) throw new Error("Pick at least one character type.");
  const requested = Number.isFinite(options.length) ? Math.floor(options.length) : DEFAULT_PASSWORD_LENGTH;
  const length = Math.max(classes.length, Math.min(256, requested));
  const alphabet = classes.join("");
  for (;;) {
    let value = "";
    for (let index = 0; index < length; index += 1) value += alphabet[randomInt(alphabet.length)];
    if (classes.every((set) => [...value].some((char) => set.includes(char)))) {
      return { value, entropyBits: length * Math.log2(alphabet.length) };
    }
  }
}

export type PassphraseOptions = {
  words: number;
  separator?: string;
  capitalize?: boolean;
  includeNumber?: boolean;
};

export function generatePassphrase(options: PassphraseOptions): { value: string; entropyBits: number } {
  const requested = Number.isFinite(options.words) ? Math.floor(options.words) : DEFAULT_PASSPHRASE_WORDS;
  const count = Math.max(3, Math.min(20, requested));
  const separator = options.separator ?? "-";
  const words: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const word = WORDLIST[randomInt(WORDLIST.length)];
    words.push(options.capitalize ? word[0].toUpperCase() + word.slice(1) : word);
  }
  let entropyBits = count * Math.log2(WORDLIST.length);
  if (options.includeNumber) {
    const position = randomInt(count);
    words[position] = `${words[position]}${randomInt(10)}`;
    entropyBits += Math.log2(10) + Math.log2(count);
  }
  return { value: words.join(separator), entropyBits };
}

export const PASSPHRASE_WORDLIST_SIZE = WORDLIST.length;

/* ───────────────────────── Armored text (offline encrypt tool) ───────────────────────── */

const ARMOR_HEADER = "-----BEGIN PROTECTEDSHARE MESSAGE-----";
const ARMOR_FOOTER = "-----END PROTECTEDSHARE MESSAGE-----";

/** Password-encrypt text into a block that can be pasted anywhere, then opened offline. */
export async function armorText(plaintext: string, password: string): Promise<string> {
  const { payload } = await sealText(plaintext, { password });
  const body = `${payload.salt}.${payload.iv}.${payload.encryptedBlob}`;
  const lines = body.match(/.{1,64}/g) ?? [body];
  return [ARMOR_HEADER, "Version: 2 (AES-256-GCM, PBKDF2-SHA256 600k, HKDF)", "", ...lines, ARMOR_FOOTER].join("\n");
}

export function looksArmored(text: string): boolean {
  return text.includes(ARMOR_HEADER) && text.includes(ARMOR_FOOTER);
}

export async function dearmorText(armored: string, password: string): Promise<string> {
  const start = armored.indexOf(ARMOR_HEADER);
  const end = armored.indexOf(ARMOR_FOOTER);
  if (start === -1 || end === -1 || end < start) throw new Error("This doesn't look like a ProtectedShare block.");
  const inner = armored.slice(start + ARMOR_HEADER.length, end).split(/\r?\n/);
  const body = inner
    .filter((line) => line.trim() && !/^[A-Za-z-]+:\s/.test(line.trim()))
    .join("")
    .replace(/\s+/g, "");
  const [salt, iv, encryptedBlob] = body.split(".");
  if (!salt || !iv || !encryptedBlob) throw new Error("This block is incomplete. Copy it from BEGIN to END.");
  return openText({ v: 2, kdf: "password", salt, iv, encryptedBlob }, { password });
}
