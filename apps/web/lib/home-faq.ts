export const HOME_FAQS = [
  {
    question: "Can ProtectedShare read what I send?",
    answer:
      "No. Notes, EnvShare secrets, files, requests and chat messages are encrypted in your browser with AES-256-GCM before anything is sent. The server stores ciphertext and a hash it uses to check that a reader holds the key. The key itself is in the part of the link after #, which browsers don't send to servers. Like every web app that encrypts in the browser, you are trusting the JavaScript the site serves; the code is open source so you can check it or run your own copy. One exception: the remote Claude connector encrypts what you give it on our MCP server, in memory, without storing or logging it; the local MCP server encrypts on your computer.",
  },
  {
    question: "What is the #k= part of the link?",
    answer:
      "It's the 256-bit key that decrypts your share. Anyone with the full link can open it, so send it the way you'd send a key. If you'd rather the link alone not be enough, the Secure Note tool can use a separate password instead, or both.",
  },
  {
    question: "What happens after someone opens my link?",
    answer:
      "A burn-after-reading note is deleted from the database on the read that opens it. An EnvShare secret loses one read each time and is deleted at zero. A file drop uses one download as soon as a download starts; the server counts it, and cancelling doesn't give it back. When the last download finishes, the drop is deleted. Anything left is deleted at its expiry, which is at most 30 days; a cleanup job runs every 30 minutes and expired links are refused before then.",
  },
  {
    question: "Can a link preview in Slack or iMessage burn my note?",
    answer:
      "Previews fetch the page without the part after #, so they don't have the key and can't produce the token the server asks for before it hands over a note. The note page also waits for the recipient to choose to open it.",
  },
  {
    question: "Can I tell whether my link was opened?",
    answer:
      "Yes, from the browser that created it. Links you make are listed in My links, kept only in that browser. Each one holds a manage token that lets you see the status, the read count and when it was first and last opened, or revoke it. For a file drop, opened means a download started. The server keeps that receipt, with no content, until 30 days after the link expires. You can also ask for a browser notification when the link is first opened and when it's used up: your browser's push service delivers it, encrypted, and the server keeps the push address only until the link is used up, revoked or expired.",
  },
  {
    question: "How do I share API keys or a .env file safely?",
    answer:
      "Open EnvShare, paste the keys or the whole file, pick an expiry up to 30 days and how many times it can be read, from 1 to 100. Send the link. When the last read happens, the row is deleted.",
  },
  {
    question: "How big a file can I send?",
    answer:
      "Up to 25 MB per drop, across one or more files. Files are encrypted in 1 MiB chunks in your browser. File names and types are encrypted too; the server only sees the total encrypted size and the number of chunks.",
  },
  {
    question: "Is it free? Do I need an account?",
    answer:
      "It's free and there are no accounts. There is no paid plan on the hosted site. Organizations that want a separate deployment can ask about a dedicated instance.",
  },
  {
    question: "Can I host it myself?",
    answer:
      "Yes. The code is MIT licensed on GitHub. The API runs on Cloudflare Workers with a D1 database (file chunks go to an R2 bucket, or to D1 if you skip it), and the web app runs on any Node host or from the Docker image ghcr.io/kunalsiyag/protectedshare-web.",
  },
  {
    question: "How is this different from Privnote or OneTimeSecret?",
    answer:
      "The same job, one-time secrets that expire, done with the key in the link fragment so our server never receives it. It also covers .env files with read limits, file drops, secret requests, an encrypted chat room and a notepad. The comparison pages go through the differences one by one.",
  },
] as const;
