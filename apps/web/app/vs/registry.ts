/**
 * Every comparison page, in one place. The /vs hub, the "Other comparisons" row on each page and anything
 * else that links to the comparisons should read from here so the list stays in sync.
 *
 * Summaries are one honest line each, drawn from the sources listed on that page (checked October 2026).
 */

export type ComparisonGroup = "secrets" | "files" | "pastebins";

export type ComparisonEntry = {
  slug: string;
  /** The other product's name, as they write it. */
  name: string;
  group: ComparisonGroup;
  summary: string;
};

export const COMPARISON_GROUPS: { id: ComparisonGroup; title: string; blurb: string }[] = [
  {
    id: "secrets",
    title: "One-time secrets",
    blurb: "For a password, an API key or a short note that should disappear once it has been read.",
  },
  {
    id: "files",
    title: "File transfer",
    blurb: "For handing someone a file, from a signed PDF to a video too big for email.",
  },
  {
    id: "pastebins",
    title: "Pastebins and notepads",
    blurb: "For text that stays online until you remove it or it expires.",
  },
];

export const COMPARISONS: ComparisonEntry[] = [
  {
    slug: "privnote",
    name: "Privnote",
    group: "secrets",
    summary: "Self-destructing notes, with an optional email when one is read. We found no public source code.",
  },
  {
    slug: "onetimesecret",
    name: "OneTimeSecret",
    group: "secrets",
    summary: "Open-source one-time secrets. Its docs describe encryption on its servers rather than in your browser.",
  },
  {
    slug: "envshare",
    name: "EnvShare",
    group: "secrets",
    summary: "A small open-source tool that encrypts .env files in the browser and limits how many times they're read.",
  },
  {
    slug: "yopass",
    name: "Yopass",
    group: "secrets",
    summary:
      "Open source and built to self-host, with OpenPGP encryption in the browser. Requests, read receipts and files over 1 MB need a paid license.",
  },
  {
    slug: "password-pusher",
    name: "Password Pusher",
    group: "secrets",
    summary: "Links that expire by views and days, with accounts and audit logs. Its docs say encryption happens on the server.",
  },
  {
    slug: "bitwarden-send",
    name: "Bitwarden Send",
    group: "secrets",
    summary: "End-to-end encrypted text and files, sent from a Bitwarden account. File Sends need a paid plan and go up to 500 MB.",
  },
  {
    slug: "wetransfer",
    name: "WeTransfer",
    group: "files",
    summary: "Large transfers, 3 GB a month on the free plan. Its help center describes encryption in transit and at rest.",
  },
  {
    slug: "firefox-send",
    name: "Firefox Send",
    group: "files",
    summary: "Mozilla's encrypted file sharing, for files up to 2.5 GB. Shut down in 2020.",
  },
  {
    slug: "privatebin",
    name: "PrivateBin",
    group: "pastebins",
    summary:
      "An open-source pastebin that encrypts in the browser, run on many independent instances. Pastes can stay up for a year, or never expire.",
  },
  {
    slug: "protectedtext",
    name: "ProtectedText",
    group: "pastebins",
    summary: "An encrypted notepad at an address you choose, kept until you delete it.",
  },
];
