import type { FaqItem } from "../_components/tool-content";

export const STRENGTH_FAQ: FaqItem[] = [
  {
    question: "Is it safe to type my password here?",
    answer:
      "It never leaves the tab: the check is JavaScript running on your device, and it makes no network request. Even so, the safest habit is not to type a password you use today into any website. Type one built the same way and you'll learn just as much.",
  },
  {
    question: "How is password strength measured?",
    answer:
      "In bits of entropy, a count of how many guesses an attacker would need. Each bit doubles the work. The checker starts from the characters you used, then charges far less for the parts attackers guess early: common passwords and words, years, repeats, runs like abc or 123, and keys next to each other.",
  },
  {
    question: "What score should I aim for?",
    answer:
      "Strong (64 bits or more) holds up for decades against offline guessing on a fast hash. For a password manager's master password or an encrypted file, which can be attacked offline with no limit on tries, aim for Very strong (90 bits or more). A random 16-character password with mixed character types gets you there; a passphrase from our generator needs nine words.",
  },
  {
    question: "Why does my complex-looking password score low?",
    answer:
      "Because attackers don't guess one character at a time. They start with leaked passwords and dictionary words, with the usual swaps like a to @ and o to 0, then add years and symbols at the end. P@ssw0rd2024! looks complex but is made entirely of those pieces.",
  },
  {
    question: "Does a strong score mean my password is safe?",
    answer:
      "No. A password can score well and already be in a breach list, or be reused on a site that leaked it. Check it with the breached password checker, use it in one place only, and turn on two-factor sign-in where you can.",
  },
  {
    question: "How accurate are the crack times?",
    answer:
      "They're averages: half the guesses at a fixed speed. Offline assumes 10 billion guesses a second against a fast hash such as MD5 or SHA-1; slow hashes like bcrypt or Argon2 make that thousands of times slower. Online assumes 10,000 a second against a login that doesn't throttle well. Treat them as orders of magnitude.",
  },
  {
    question: "Why does the password generator give a different number?",
    answer:
      "The generator knows exactly how its passwords were made, so it reports their entropy exactly. The checker only sees the finished string and has to guess how it was built, so its number is a rough ceiling: the real strength can be lower, never higher.",
  },
];
