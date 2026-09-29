export const HOME_FAQS = [
  {
    question: "Is ProtectedShare really free?",
    answer:
      "Yes. Creating a note, an EnvShare secret, a notepad, or a chat room does not require an account. The public site does not show a price.",
  },
  {
    question: "How does the encrypted chatroom work?",
    answer:
      "A room has an id and a password. Messages are encrypted in the browser with AES-256-GCM before they are stored. People join with the room password.",
  },
  {
    question: "What is the difference between Secure Notes and EnvShare?",
    answer:
      "Secure Notes can open from the link, with the password in the URL hash, or you can keep the password off the link and send it on another channel. EnvShare always puts the password in the hash. You choose how many times that link can be opened, from 1 to 100.",
  },
  {
    question: "How is this different from EnvShare?",
    answer:
      "The EnvShare page shares a .env file or API key with browser-side AES-256-GCM, an expiry up to 30 days, and 1 to 100 reads. The same site also has secure notes, an encrypted notepad, and an anonymous chatroom.",
  },
  {
    question: "Can the server read my secrets?",
    answer:
      "The server stores ciphertext, the IV, and the salt, plus a password proof it can check. It does not store the passphrase or the plaintext. Decryption runs in the recipient's browser.",
  },
  {
    question: "Is this a good ProtectedText alternative?",
    answer:
      "ProtectedShare encrypts in the browser with AES-256-GCM, and it adds expiring notes, .env sharing, a notepad, and a chat room. You can open it without creating an account.",
  },
  {
    question: "Is ProtectedShare a secret sharing website?",
    answer:
      "Yes. It is built for sharing a secret, a note, an API key, or a .env file through an encrypted link that expires, and an EnvShare link can also stop after a set number of reads.",
  },
  {
    question: "How do I share API keys securely?",
    answer:
      "Open EnvShare, paste the keys or .env file, pick 1 hour, 1 day, 7 days, or a custom time up to 30 days, and set the read count from 1 to 100. The password stays in the link hash and is not sent to the server.",
  },
  {
    question: "What happens after someone opens my link?",
    answer:
      "A Secure Note stays until it expires, unless burn after reading is on, which deletes it on the first open. An EnvShare secret loses one read each time it is opened and is deleted when the count reaches zero or the expiry passes.",
  },
] as const;
