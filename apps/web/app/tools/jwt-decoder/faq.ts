import type { FaqItem } from "../_components/tool-content";

export const JWT_FAQ: FaqItem[] = [
  {
    question: "Is it safe to paste a JWT here?",
    answer:
      "The token is decoded by JavaScript in your tab and never sent to our server or anyone else's; the page makes no network request when you paste. Still, a live token is a credential: whoever holds it can act as you until it expires. Prefer expired or test tokens on any website, and you can confirm in your browser's network tab that nothing leaves.",
  },
  {
    question: "Can a JWT be decoded without the secret?",
    answer:
      "Yes. The header and payload are only base64url-encoded, not encrypted, so anyone with the token can read them. The secret or key is needed to verify the signature, or to create a new token, not to read one.",
  },
  {
    question: "Why does it say the signature doesn't match?",
    answer:
      "Usually the secret is wrong or in the wrong format: many apps store it base64-encoded, so try the Base64 option. Otherwise the token was changed after signing, or it was signed with a different algorithm or key than you expect.",
  },
  {
    question: "What do exp, iat and nbf mean?",
    answer:
      "They're times in seconds since 1 January 1970 (UTC). exp is when the token stops being valid, iat when it was issued, and nbf the moment before which it must not be accepted. Servers often allow a minute or two of leeway for clock differences.",
  },
  {
    question: "What's the difference between HS256 and RS256?",
    answer:
      "HS256 uses one shared secret to sign and to verify, so every service that checks the token could also mint one. RS256 and ES256 sign with a private key and verify with a public key, so verifiers can't create tokens. This tool verifies HS256, HS384 and HS512.",
  },
  {
    question: "Is a JWT encrypted?",
    answer:
      "A normal JWT is signed, not encrypted: tampering is detectable, but the contents are readable. Encrypted tokens (JWE) have five parts instead of three; the decoder shows their header and tells you the payload needs the key.",
  },
  {
    question: "Why is alg none dangerous?",
    answer:
      "It means the token has no signature, so anyone can write any claims they like. Some older libraries accepted such tokens when the header asked for it. A server should fix the algorithms it accepts and reject everything else, including none.",
  },
];
