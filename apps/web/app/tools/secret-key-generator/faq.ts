import type { FaqItem } from "../_components/tool-content";

export const KEYS_FAQ: FaqItem[] = [
  {
    question: "Are these keys random enough for production?",
    answer:
      "Yes. Every byte comes from crypto.getRandomValues, the browser's interface to the operating system's cryptographically secure random generator, the same kind of source command-line tools like openssl rand use. Characters picked from an alphabet use rejection sampling, so each one is equally likely.",
  },
  {
    question: "Is it safe to generate a secret on a website?",
    answer:
      "On this page the key is made in your tab and never sent or stored: there's no request to watch for, and the code is open source. If your policy says keys must be made locally anyway, the Strength panel shows the command-line equivalent for each format.",
  },
  {
    question: "How long should a JWT secret be?",
    answer:
      "For HS256, at least 256 bits (32 random bytes): RFC 7518 requires a key at least as long as the hash output. Use 48 bytes for HS384 and 64 for HS512. Short or human-chosen secrets can be guessed offline from a single token.",
  },
  {
    question: "What's the difference between hex, base64 and base64url?",
    answer:
      "They're three ways to write the same bytes as text. Hex uses 0–9 and a–f, two characters per byte. Base64 is about a third shorter but uses + / and =. Base64url swaps + and / for - and _ and drops the padding, so it's safe in URLs, headers and file names.",
  },
  {
    question: "Is a UUID a secret?",
    answer:
      "A version 4 UUID from this page has 122 random bits, which is unguessable. But UUIDs are designed as identifiers and tend to end up in URLs, logs and analytics. Use one of the key formats for anything that grants access.",
  },
  {
    question: "Why does the Django key contain symbols?",
    answer:
      "It uses Django's own alphabet from get_random_secret_key(): lowercase letters, digits and !@#$%^&*(-_=+). Fifty characters give about 282 bits. The .env line wraps it in single quotes so the $ and # survive dotenv parsers and the shell.",
  },
  {
    question: "How should I store an API key?",
    answer:
      "Show the full key to its owner once, then store only a hash of it, such as the SHA-256 this page shows. When a request arrives, hash the key it carries and compare. A fixed prefix makes your keys recognizable in logs and to secret scanners.",
  },
];
