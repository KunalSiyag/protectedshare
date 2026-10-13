/**
 * The WIFI: QR payload phone cameras read (the ZXing "WIFI:" format, also what Android's own
 * "Share Wi-Fi" screen produces):
 *
 *   WIFI:T:<WPA|WEP|nopass>;S:<ssid>;P:<password>;H:<true|false>;;
 *
 * Backslash, semicolon, comma, colon and double quote inside a value are escaped with a backslash.
 */

export type WifiSecurity = "WPA" | "WEP" | "nopass";

export type WifiConfig = {
  ssid: string;
  security: WifiSecurity;
  password: string;
  hidden: boolean;
};

/** Escape \ ; , : " with a backslash. One pass, so a backslash is never escaped twice. */
export function escapeWifiValue(value: string): string {
  return value.replace(/[\\;,:"]/g, (char) => `\\${char}`);
}

/** Drop lone surrogate halves, which can't be encoded as UTF-8 (and so can't go in a QR code). */
export function wellFormed(value: string): string {
  let out = "";
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        out += value[index] + value[index + 1];
        index += 1;
      }
      continue;
    }
    if (code >= 0xdc00 && code <= 0xdfff) continue;
    out += value[index];
  }
  return out;
}

export function buildWifiPayload({ ssid, security, password, hidden }: WifiConfig): string {
  const parts = [`T:${security}`, `S:${escapeWifiValue(wellFormed(ssid))}`];
  if (security !== "nopass") parts.push(`P:${escapeWifiValue(wellFormed(password))}`);
  parts.push(`H:${hidden ? "true" : "false"}`);
  return `WIFI:${parts.join(";")};;`;
}

/** The same payload with the password replaced by bullets, for showing on screen. */
export function maskedWifiPayload(config: WifiConfig): string {
  if (config.security === "nopass" || !config.password) return buildWifiPayload(config);
  const marker = "\u0000";
  return buildWifiPayload({ ...config, password: marker }).replace(marker, "•".repeat(Math.min(config.password.length, 16)));
}

export function utf8Length(value: string): number {
  return new TextEncoder().encode(wellFormed(value)).length;
}

export type WifiIssue = { field: "ssid" | "password"; tone: "warn" | "danger"; text: string };

const HEX = /^[0-9a-f]+$/i;

/**
 * Checks against what routers accept. Nothing here blocks the code: an unusual value can still be
 * right for someone's network, so these are warnings to read, not rules.
 */
export function wifiIssues({ ssid, security, password }: WifiConfig): WifiIssue[] {
  const issues: WifiIssue[] = [];
  const ssidBytes = utf8Length(ssid);
  if (ssidBytes > 32) {
    issues.push({ field: "ssid", tone: "warn", text: `Network names are at most 32 bytes. This one is ${ssidBytes}.` });
  }
  if (ssid && ssid.trim() !== ssid) {
    issues.push({ field: "ssid", tone: "warn", text: "Starts or ends with a space. That's allowed, but check your network really has it." });
  }
  if (security === "WPA" && password) {
    const ascii = /^[\x20-\x7e]*$/.test(password);
    if (password.length === 64 && !HEX.test(password)) {
      issues.push({ field: "password", tone: "warn", text: "A 64-character WPA key must be all hex digits (0–9, a–f)." });
    } else if (password.length < 8) {
      issues.push({ field: "password", tone: "warn", text: "WPA passwords are at least 8 characters. Check for a typo." });
    } else if (password.length > 64) {
      issues.push({ field: "password", tone: "warn", text: "WPA passwords are at most 63 characters (or 64 hex digits)." });
    } else if (!ascii) {
      issues.push({ field: "password", tone: "warn", text: "Has characters outside plain ASCII. Some phones and routers handle those differently." });
    }
  }
  if (security === "WEP" && password) {
    const okLength = [5, 13].includes(password.length) || ([10, 26].includes(password.length) && HEX.test(password));
    if (!okLength) {
      issues.push({ field: "password", tone: "warn", text: "WEP keys are 5 or 13 characters, or 10 or 26 hex digits." });
    }
  }
  if (password && password.trim() !== password && security !== "nopass") {
    issues.push({ field: "password", tone: "warn", text: "Starts or ends with a space. Phones will include it when they join." });
  }
  return issues;
}

/** A safe file name stem from the network name: "Home Wi-Fi 5G" -> "home-wi-fi-5g". */
export function fileStem(ssid: string): string {
  const slug = ssid
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `wifi-${slug || "network"}`;
}
