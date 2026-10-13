import type { FaqItem } from "../../tools/_components/tool-content";

/** Shown on /integrations/claude and used for its FAQPage JSON-LD. Plain text only. */
export const CLAUDE_FAQ: readonly FaqItem[] = [
  {
    question: "Does Claude see my secret?",
    answer:
      "Yes. Anything you type or paste into a conversation is part of it, and so is the link a tool returns, which carries the key after the #. The connector protects the secret on its way to the recipient and on our servers. It can't take it back out of the conversation it was typed into.",
  },
  {
    question: "What does the remote connector store?",
    answer:
      "Nothing. It encrypts the text in memory and sends only ciphertext to the same storage API the website uses. It doesn't log tool arguments or results. Requests to mcp.protectedshare.me go straight to that Worker on Cloudflare; our web host, Vercel, isn't in the path.",
  },
  {
    question: "Why run the local server instead?",
    answer:
      "The text is encrypted on your computer, so it never reaches us unencrypted. You can also add a password to a link, and Claude can open links people send you. It needs Node.js 20 or later.",
  },
  {
    question: "Do I need an account or an API key?",
    answer: "No. The connector works without signing in, and the local server has nothing to set up.",
  },
  {
    question: "Will links made in Claude show up in My links?",
    answer:
      "No. My links lives in the browser that made a link. Each tool result includes a manage token instead: while it's in the conversation, Claude can use it to check whether the link was opened, or to revoke it.",
  },
  {
    question: "Can Claude open a link someone sent me?",
    answer:
      "With the local server, yes. It decrypts the link on your computer and uses up a read, exactly like opening it in a browser. The remote connector can't open links.",
  },
  {
    question: "Why can't the remote connector add a password?",
    answer:
      "A password is stretched with 600,000 rounds of PBKDF2. That takes more processing time than the connector gets per request, so it only makes links that open with the key in the link. The local server adds passwords on your computer.",
  },
  {
    question: "Which MCP versions and clients does it work with?",
    answer:
      "The remote server speaks Streamable HTTP at https://mcp.protectedshare.me/mcp with no sign-in. It supports MCP 2026-07-28 and the earlier 2025-11-25, 2025-06-18 and 2025-03-26 revisions, so any MCP client that connects to remote servers can use it. The local server speaks the same versions over stdio.",
  },
  {
    question: "Is it open source?",
    answer:
      "Yes. The connector and the local server are MIT licensed and live in the same GitHub repository as the website: apps/mcp, packages/mcp-core and packages/mcp-server.",
  },
];
