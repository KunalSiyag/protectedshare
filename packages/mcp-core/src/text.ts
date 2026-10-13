/**
 * Wording shared by tool descriptions and server instructions. Descriptions say what a tool
 * does and where data goes; they don't tell the model how to behave.
 */
import type { Mode } from "./shared";

export const SITE_NAME = "ProtectedShare";

/** Where encryption happens, per mode. One sentence. */
export function encryptionSentence(mode: Mode): string {
  return mode === "remote"
    ? "The text is encrypted with AES-256-GCM on ProtectedShare's MCP server, which keeps it in memory only long enough to encrypt it and doesn't store or log it; the storage API receives only ciphertext."
    : "The text is encrypted with AES-256-GCM on this computer before anything is sent; ProtectedShare's servers receive only ciphertext.";
}

export const KEY_IN_LINK_SENTENCE =
  "The decryption key is in the link after '#', so anyone with the whole link can open it.";

export function instructions(mode: Mode): string {
  const where =
    mode === "remote"
      ? "In this remote connector, secrets you hand to a tool pass through ProtectedShare's MCP server to be encrypted; they aren't stored or logged there."
      : "This server runs on your computer: secrets are encrypted, and links opened, locally. ProtectedShare's servers receive only ciphertext.";
  return [
    "ProtectedShare (https://protectedshare.me) turns a secret into an encrypted link that another person opens in a browser, with no accounts. The decryption key travels in the link after '#'; ProtectedShare's storage only holds ciphertext, and expired, burned, used-up or revoked links are deleted from it.",
    where,
    "Links, generated passwords and opened text that these tools return become part of the conversation, like anything else in it.",
    "Every link these tools create comes with a manage_token: check_link_status and revoke_link need it, and nothing else keeps a copy.",
  ].join(" ");
}

export const SERVER_DESCRIPTION: Record<Mode, string> = {
  // Not end-to-end: this connector receives the plaintext and encrypts it on ProtectedShare's server.
  remote:
    "Create encrypted, self-destructing ProtectedShare links (notes, .env files, secret requests), check whether they were opened, and revoke them. This remote connector encrypts on ProtectedShare's MCP server; the local server and the website encrypt on your device.",
  local:
    "Create and open end-to-end encrypted, self-destructing ProtectedShare links from your own machine: notes, .env files and secret requests, with optional passwords and a breached-password check.",
};
