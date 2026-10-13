/**
 * generate_password: the generators behind /tools/password-generator (crypto v2
 * generatePassword / generatePassphrase, rejection-sampled randomInt), with the same defaults:
 * 20-character passwords, 5-word passphrases, 6-digit PINs.
 */
import { PASSPHRASE_WORDLIST_SIZE, generatePassphrase, generatePassword, randomInt } from "@protectedshare/crypto";
import { ToolError, bool, fail, int, ok, str, type Mode, type ToolDefinition } from "../shared";

type Kind = "password" | "passphrase" | "pin";

const PASSWORD_OPTIONS = ["length", "uppercase", "lowercase", "digits", "symbols", "avoid_ambiguous"] as const;
const PASSPHRASE_OPTIONS = ["words", "separator", "capitalize", "include_number"] as const;
const PIN_OPTIONS = ["length"] as const;
const OPTIONS_BY_KIND: Record<Kind, readonly string[]> = { password: PASSWORD_OPTIONS, passphrase: PASSPHRASE_OPTIONS, pin: PIN_OPTIONS };

function rejectForeignOptions(kind: Kind, args: Record<string, unknown>): void {
  const allowed = new Set(["kind", ...OPTIONS_BY_KIND[kind]]);
  const foreign = Object.keys(args).filter((name) => args[name] !== undefined && !allowed.has(name));
  if (foreign.length > 0) {
    throw new ToolError(
      `${foreign.join(", ")} ${foreign.length === 1 ? "doesn't" : "don't"} apply to kind "${kind}". Options for ${kind}: ${OPTIONS_BY_KIND[kind].join(", ")}.`
    );
  }
}

function inRange(value: number, min: number, max: number, what: string): number {
  if (value < min || value > max) throw new ToolError(`${what} must be from ${min} to ${max}.`);
  return value;
}

/** By entropy alone. A short PIN rates "weak" here even where the device limits guesses. */
function strengthLabel(bits: number): string {
  if (bits >= 100) return "very strong";
  if (bits >= 72) return "strong";
  if (bits >= 50) return "moderate";
  return "weak";
}

export const generatePasswordTool: ToolDefinition = {
  name: "generate_password",
  title: "Generate password",
  modes: ["remote", "local"],
  description: (mode: Mode) =>
    [
      "Generate a random password, passphrase or numeric PIN with a cryptographically secure random number generator, and report its strength in bits of entropy.",
      mode === "remote"
        ? "Runs on ProtectedShare's MCP server; nothing is stored there."
        : "Runs on this computer; nothing is sent anywhere.",
      "The value is returned in the tool result.",
    ].join(" "),
  inputSchema: () => ({
    type: "object",
    additionalProperties: false,
    properties: {
      kind: {
        type: "string",
        enum: ["password", "passphrase", "pin"],
        default: "password",
        description: "What to generate. Default password.",
      },
      length: {
        type: "integer",
        minimum: 4,
        maximum: 128,
        description: "Password: 8 to 128 characters (default 20). PIN: 4 to 12 digits (default 6).",
      },
      uppercase: { type: "boolean", description: "Password only. Include A–Z. Default true." },
      lowercase: { type: "boolean", description: "Password only. Include a–z. Default true." },
      digits: { type: "boolean", description: "Password only. Include 0–9. Default true." },
      symbols: { type: "boolean", description: "Password only. Include symbols such as ! @ # $ %. Default true." },
      avoid_ambiguous: {
        type: "boolean",
        description: "Password only. Leave out look-alike characters (I, l, 1, O, 0, o). Default false.",
      },
      words: { type: "integer", minimum: 3, maximum: 12, description: "Passphrase only. Number of words, 3 to 12. Default 5." },
      separator: {
        type: "string",
        enum: ["-", ".", "_", " "],
        description: "Passphrase only. Character between words. Default '-'.",
      },
      capitalize: { type: "boolean", description: "Passphrase only. Capitalize each word. Default false." },
      include_number: { type: "boolean", description: "Passphrase only. Add one digit to a random word. Default false." },
    },
  }),
  outputSchema: {
    type: "object",
    properties: {
      kind: { type: "string", enum: ["password", "passphrase", "pin"] },
      value: { type: "string" },
      entropy_bits: { type: "number", description: "log2 of the number of equally likely values." },
      strength: { type: "string" },
      details: { type: "string" },
    },
    required: ["kind", "value", "entropy_bits", "strength", "details"],
  },
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  async handler(args) {
    try {
      const kind = (str(args, "kind") ?? "password") as Kind;
      if (!(kind in OPTIONS_BY_KIND)) throw new ToolError('kind must be "password", "passphrase" or "pin".');
      rejectForeignOptions(kind, args);

      let value: string;
      let bits: number;
      let details: string;
      if (kind === "password") {
        const length = inRange(int(args, "length") ?? 20, 8, 128, "A password's length");
        const sets = {
          lower: bool(args, "lowercase") ?? true,
          upper: bool(args, "uppercase") ?? true,
          digits: bool(args, "digits") ?? true,
          symbols: bool(args, "symbols") ?? true,
        };
        if (!Object.values(sets).some(Boolean)) throw new ToolError("Turn on at least one of uppercase, lowercase, digits or symbols.");
        const avoidAmbiguous = bool(args, "avoid_ambiguous") ?? false;
        ({ value, entropyBits: bits } = generatePassword({ length, ...sets, avoidAmbiguous }));
        const pool = Math.round(2 ** (bits / length));
        details = `${length} characters, each one of ${pool} possibilities.`;
      } else if (kind === "passphrase") {
        const words = inRange(int(args, "words") ?? 5, 3, 12, "words");
        ({ value, entropyBits: bits } = generatePassphrase({
          words,
          separator: str(args, "separator") ?? "-",
          capitalize: bool(args, "capitalize") ?? false,
          includeNumber: bool(args, "include_number") ?? false,
        }));
        details = `${words} words picked at random from a ${PASSPHRASE_WORDLIST_SIZE.toLocaleString("en-US")}-word list.`;
      } else {
        const digits = inRange(int(args, "length") ?? 6, 4, 12, "A PIN's length");
        value = Array.from({ length: digits }, () => String(randomInt(10))).join("");
        bits = digits * Math.log2(10);
        details = `${digits} random digits.`;
      }
      const entropy = Math.round(bits * 10) / 10;
      return ok({ kind, value, entropy_bits: entropy, strength: strengthLabel(bits), details });
    } catch (error) {
      if (error instanceof ToolError) return fail(error.message);
      throw error;
    }
  },
};
