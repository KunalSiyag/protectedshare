import { MAX_SHARE_TTL_SECONDS, MIN_SHARE_TTL_SECONDS } from "@protectedshare/contracts";

export const MIN_SHARE_TTL_MS = MIN_SHARE_TTL_SECONDS * 1000;
export const MAX_SHARE_TTL_MS = MAX_SHARE_TTL_SECONDS * 1000;

export type ExpiryChoice = "3600" | "86400" | "604800" | "custom";

export const EXPIRY_PRESETS: { value: Exclude<ExpiryChoice, "custom">; label: string }[] = [
  { value: "3600", label: "1 hour" },
  { value: "86400", label: "1 day" },
  { value: "604800", label: "7 days" },
];

export function toDatetimeLocal(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function resolveExpiresAt(choice: ExpiryChoice, customLocal: string, now = Date.now()): { expiresAt: number } | { error: string } {
  if (choice !== "custom") {
    return { expiresAt: now + Number(choice) * 1000 };
  }

  const parsed = new Date(customLocal).getTime();
  if (!customLocal || Number.isNaN(parsed)) {
    return { error: "Choose the date and time this link should expire." };
  }
  if (parsed < now + MIN_SHARE_TTL_MS) {
    return { error: "Expiration has to be at least 5 minutes from now." };
  }
  if (parsed > now + MAX_SHARE_TTL_MS) {
    return { error: "Expiration can be at most 30 days from now." };
  }
  return { expiresAt: parsed };
}

export function formatShareDeadline(expiresAt: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(expiresAt);
}

export function passwordFromLocationHash(): string {
  if (typeof window === "undefined") return "";
  const raw = window.location.hash.slice(1);
  if (!raw) return "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function withPasswordHash(url: string, password: string): string {
  return `${url}#${encodeURIComponent(password)}`;
}
