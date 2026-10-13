import { randomInt, toBase64Url } from "@protectedshare/crypto";

/**
 * Random keys in the formats frameworks expect. Every byte and character comes from
 * crypto.getRandomValues; characters from an alphabet are picked with randomInt, which
 * rejects biased samples so each one is equally likely.
 */

export type Encoding = "hex" | "base64" | "base64url";
export type PresetId = "bytes" | "jwt" | "django" | "rails" | "authjs" | "apikey" | "uuid";

export type Preset = {
  id: PresetId;
  label: string;
  /** One line under the label: size and format. */
  short: string;
  /** Default variable name for the .env line. */
  envName: string;
};

export const PRESETS: Preset[] = [
  { id: "bytes", label: "Random bytes", short: "16–128 bytes, hex or base64", envName: "SECRET_KEY" },
  { id: "jwt", label: "JWT HS256 secret", short: "32 bytes, base64url", envName: "JWT_SECRET" },
  { id: "django", label: "Django SECRET_KEY", short: "50 characters, Django's alphabet", envName: "DJANGO_SECRET_KEY" },
  { id: "rails", label: "Rails secret_key_base", short: "64 bytes, hex", envName: "SECRET_KEY_BASE" },
  { id: "authjs", label: "Auth.js AUTH_SECRET", short: "32 bytes, base64", envName: "AUTH_SECRET" },
  { id: "apikey", label: "API key", short: "Your prefix + 32 characters", envName: "API_KEY" },
  { id: "uuid", label: "UUID v4", short: "122 random bits", envName: "ID" },
];

/** The alphabet in django.core.management.utils.get_random_secret_key(). */
export const DJANGO_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)";
const DJANGO_LENGTH = 50;
const BASE62 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const API_KEY_LENGTH = 32;

export const MIN_BYTES = 16;
export const MAX_BYTES = 128;

export function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

export function encodeBytes(bytes: Uint8Array, encoding: Encoding): string {
  if (encoding === "hex") return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  if (encoding === "base64url") return toBase64Url(bytes);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function randomString(alphabet: string, length: number): string {
  let value = "";
  for (let index = 0; index < length; index += 1) value += alphabet[randomInt(alphabet.length)];
  return value;
}

export function uuidV4(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = encodeBytes(bytes, "hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Letters, digits, underscore and hyphen only, so the key stays one shell- and URL-safe word. */
export function cleanPrefix(prefix: string): string {
  return prefix.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 24);
}

export type GenerateOptions = { bytes: number; encoding: Encoding; prefix: string };

export type Generated = {
  value: string;
  /** Entropy of the random part, in bits. */
  bits: number;
  /** "32 bytes as base64url, 43 characters". */
  detail: string;
};

export function generateKey(preset: PresetId, options: GenerateOptions): Generated {
  switch (preset) {
    case "jwt": {
      const value = encodeBytes(randomBytes(32), "base64url");
      return { value, bits: 256, detail: `32 bytes as base64url, ${value.length} characters` };
    }
    case "django": {
      // django-environ can read a value that starts with "$" as a reference to another variable
      // (its "proxied values"), so that one case is drawn again. It costs about 0.03 bits.
      let value = randomString(DJANGO_ALPHABET, DJANGO_LENGTH);
      while (value.startsWith("$")) value = randomString(DJANGO_ALPHABET, DJANGO_LENGTH);
      return {
        value,
        bits: DJANGO_LENGTH * Math.log2(DJANGO_ALPHABET.length),
        detail: `${DJANGO_LENGTH} characters from ${DJANGO_ALPHABET.length} options each`,
      };
    }
    case "rails": {
      const value = encodeBytes(randomBytes(64), "hex");
      return { value, bits: 512, detail: `64 bytes as hex, ${value.length} characters` };
    }
    case "authjs": {
      const value = encodeBytes(randomBytes(32), "base64");
      return { value, bits: 256, detail: `32 bytes as base64, ${value.length} characters` };
    }
    case "apikey": {
      const prefix = cleanPrefix(options.prefix);
      const value = `${prefix}${randomString(BASE62, API_KEY_LENGTH)}`;
      return {
        value,
        bits: API_KEY_LENGTH * Math.log2(BASE62.length),
        detail: `${prefix ? `"${prefix}" + ` : ""}${API_KEY_LENGTH} characters from A–Z, a–z, 0–9`,
      };
    }
    case "uuid": {
      return { value: uuidV4(), bits: 122, detail: "Version 4: 122 random bits, 6 fixed" };
    }
    default: {
      const length = Math.min(MAX_BYTES, Math.max(MIN_BYTES, Math.floor(options.bytes) || 32));
      const value = encodeBytes(randomBytes(length), options.encoding);
      return { value, bits: length * 8, detail: `${length} bytes as ${options.encoding}, ${value.length} characters` };
    }
  }
}

export const ENV_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * NAME=value for a .env file. Values with anything beyond letters, digits, _ - and . are
 * single-quoted, which dotenv, python-dotenv, Docker Compose and the shell all read literally
 * (none of these alphabets contains a single quote).
 */
export function envLine(name: string, value: string): string {
  return `${name}=${/^[A-Za-z0-9_.-]+$/.test(value) ? value : `'${value}'`}`;
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
