import type { FaqItem } from "../_components/tool-content";

export const BREACH_FAQ: FaqItem[] = [
  {
    question: "Is it safe to check my real password here?",
    answer:
      "The password never leaves your browser. It's hashed with SHA-1 in the tab, and only the first five of the hash's 40 characters are sent. Hundreds of breached passwords share any five characters, so the service can't tell which one, if any, you checked. You can watch the single request in your browser's developer tools.",
  },
  {
    question: "What should I do if my password was found?",
    answer:
      "Stop using it. Attackers feed breached passwords into logins everywhere, so change it on every account that uses it, starting with your email, and turn on two-factor sign-in where you can. A hit doesn't always mean one of your accounts leaked: if someone else used the same password, it's on the list too.",
  },
  {
    question: "My password wasn't found. Is it strong?",
    answer:
      "Not necessarily. Not found only means it isn't in the breach data collected so far. A short or predictable password can still be guessed quickly. Check it with the password strength checker, and use each password in one place only.",
  },
  {
    question: "What is k-anonymity?",
    answer:
      "A way to look something up without saying exactly what. Your browser sends a small part of the password's hash that many other hashes share, gets back all of them, and finds the match itself. The service only learns which group you asked about.",
  },
  {
    question: "Why SHA-1? Isn't it broken?",
    answer:
      "SHA-1 is broken for collisions, meaning someone can craft two different inputs with the same hash. That doesn't matter here: the hash is only used to find a bucket in the list. What protects your password is that just five of its 40 hash characters are sent.",
  },
  {
    question: "Where does the data come from?",
    answer:
      "From Pwned Passwords, the free service run by Have I Been Pwned. It's a large corpus of passwords exposed in earlier data breaches, with a count of how often each was seen. This page is independent of Have I Been Pwned and simply calls its public API.",
  },
  {
    question: "Does this check my email address too?",
    answer:
      "No. It checks passwords only. To see which breaches include your email address, search it on haveibeenpwned.com.",
  },
];
