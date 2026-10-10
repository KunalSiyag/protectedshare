import type { FaqItem } from "../_components/tool-content";

export const PASSWORD_FAQ: FaqItem[] = [
  {
    question: "Is this password generator safe to use?",
    answer:
      "Passwords are made in your browser with crypto.getRandomValues, the operating system's secure random source, and are never sent anywhere. The page loads from our server like any website, but the generator makes no network requests. The code is open source under the MIT license.",
  },
  {
    question: "How long should a password be?",
    answer:
      "For a random password with letters, digits and symbols, 16 characters gives about 100 bits of entropy, which is far out of reach of any known guessing attack. If a site caps length, use the longest it allows and turn on every character type it accepts.",
  },
  {
    question: "Are passphrases better than passwords?",
    answer:
      "Neither is better by nature. Strength comes from how many equally likely choices there were. Six random words from our 1,629-word list give about 64 bits; a random 10-character password using every character type gives about the same. Passphrases are easier to type and remember, so use them for things you unlock by hand, such as a password manager or a laptop.",
  },
  {
    question: "What do the crack times mean?",
    answer:
      "They are the average time to guess the password if the attacker knows exactly how it was generated. Offline assumes 10 billion guesses a second against a leaked database with a fast hash such as MD5 or SHA-1. Online assumes 10,000 guesses a second against a login. Slow hashes like bcrypt or Argon2 make offline guessing thousands of times slower.",
  },
  {
    question: "Do you store the passwords I generate?",
    answer:
      "No. The history on this page lives in the tab's memory and is gone when you reload or close it. Nothing is written to local storage, cookies or our servers.",
  },
  {
    question: "Does the password checker send my password anywhere?",
    answer:
      "No. The checker runs in the page. It compares your password against a short built-in list of common passwords and patterns, so it can only say a password looks weak, never prove it is strong. Don't type a password you use today into any website, including this one.",
  },
  {
    question: "How do I send a generated password to someone?",
    answer:
      "Don't paste it into chat or email, where it stays forever. Copy it, open a Secure Note, and send the link. The note is encrypted in your browser and can delete itself after one read.",
  },
];
