export function isCryptoRuntimeAvailable(): boolean {
  return typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.subtle !== "undefined";
}

export type EncryptedPayload = {
  encryptedBlob: string;
  iv: string;
  salt: string;
};

const PBKDF2_ITERATIONS = 210_000;
const PBKDF2_HASH = "SHA-256";
const AES_ALGORITHM = "AES-GCM";
const AES_KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+=";
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function requireCrypto(): Crypto {
  if (!isCryptoRuntimeAvailable()) {
    throw new Error("Web Crypto API is unavailable in the current runtime.");
  }
  return globalThis.crypto;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

async function deriveAesKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const cryptoRuntime = requireCrypto();
  const passwordKey = await cryptoRuntime.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return cryptoRuntime.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: toArrayBuffer(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH
    },
    passwordKey,
    { name: AES_ALGORITHM, length: AES_KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encrypt(plaintext: string, password: string): Promise<EncryptedPayload> {
  const cryptoRuntime = requireCrypto();
  const iv = cryptoRuntime.getRandomValues(new Uint8Array(IV_LENGTH));
  const salt = cryptoRuntime.getRandomValues(new Uint8Array(SALT_LENGTH));
  const key = await deriveAesKey(password, salt);
  const encrypted = await cryptoRuntime.subtle.encrypt(
    { name: AES_ALGORITHM, iv: toArrayBuffer(iv) },
    key,
    textEncoder.encode(plaintext)
  );

  return {
    encryptedBlob: bytesToBase64Url(new Uint8Array(encrypted)),
    iv: bytesToBase64Url(iv),
    salt: bytesToBase64Url(salt)
  };
}

export async function decrypt(
  encryptedBlob: string,
  password: string,
  iv: string,
  salt: string
): Promise<string> {
  const cryptoRuntime = requireCrypto();
  const decodedIv = base64UrlToBytes(iv);
  const decodedSalt = base64UrlToBytes(salt);
  const key = await deriveAesKey(password, decodedSalt);
  const decrypted = await cryptoRuntime.subtle.decrypt(
    { name: AES_ALGORITHM, iv: toArrayBuffer(decodedIv) },
    key,
    toArrayBuffer(base64UrlToBytes(encryptedBlob))
  );

  return textDecoder.decode(decrypted);
}

export async function sha256(value: string): Promise<string> {
  const cryptoRuntime = requireCrypto();
  const digest = await cryptoRuntime.subtle.digest("SHA-256", textEncoder.encode(value));
  return bytesToBase64Url(new Uint8Array(digest));
}

export async function derivePasswordProof(password: string): Promise<string> {
  const cryptoRuntime = requireCrypto();
  const salt = textEncoder.encode("protectedshare-proof-salt-v1");
  const passwordKey = await cryptoRuntime.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const derivedKey = await cryptoRuntime.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: toArrayBuffer(salt),
      iterations: 100_000,
      hash: "SHA-256"
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const exported = await cryptoRuntime.subtle.exportKey("raw", derivedKey);
  const digest = await cryptoRuntime.subtle.digest("SHA-256", exported);
  return bytesToBase64Url(new Uint8Array(digest));
}

export function generateRandomPassword(length = 24): string {
  if (!Number.isInteger(length) || length < 1) {
    throw new Error("Password length must be a positive integer.");
  }

  const cryptoRuntime = requireCrypto();
  const random = cryptoRuntime.getRandomValues(new Uint32Array(length));
  let password = "";

  for (let index = 0; index < random.length; index += 1) {
    password += PASSWORD_ALPHABET[random[index] % PASSWORD_ALPHABET.length];
  }

  return password;
}
