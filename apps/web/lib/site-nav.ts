import {
  Binary,
  FileLock,
  FileUp,
  Inbox,
  KeyRound,
  LockKeyhole,
  MessagesSquare,
  NotebookPen,
  type LucideIcon,
} from "lucide-react";

export type NavProduct = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export type NavGroup = {
  label: string;
  items: NavProduct[];
};

export const PRODUCT_GROUPS: NavGroup[] = [
  {
    label: "Share",
    items: [
      { href: "/notes", label: "Secure note", description: "Encrypted text behind a link. Can burn after one read.", icon: FileLock },
      { href: "/secrets", label: "EnvShare", description: "Send .env files and API keys with a read limit.", icon: KeyRound },
      { href: "/files", label: "File drop", description: "Encrypted files up to 25 MB, with a download limit.", icon: FileUp },
      { href: "/request", label: "Secret request", description: "Ask someone for a secret, encrypted to you.", icon: Inbox },
    ],
  },
  {
    label: "Talk",
    items: [
      { href: "/chat", label: "Chat", description: "An encrypted room, purged when everyone leaves.", icon: MessagesSquare },
    ],
  },
  {
    label: "Keep",
    items: [
      { href: "/notepad", label: "Notepad", description: "Encrypted notes in your browser, with optional sync.", icon: NotebookPen },
    ],
  },
  {
    label: "Free tools",
    items: [
      { href: "/tools/password-generator", label: "Password generator", description: "Passwords and passphrases, generated locally.", icon: LockKeyhole },
      { href: "/tools/encrypt-text", label: "Encrypt text", description: "Lock text into a block only a password opens.", icon: Binary },
    ],
  },
];

export const PRIMARY_LINKS = [
  { href: "/security", label: "Security" },
  { href: "/pricing", label: "Pricing" },
  { href: "/self-host", label: "Self-host" },
  { href: "/blog", label: "Blog" },
] as const;

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export const PRODUCT_HREFS = PRODUCT_GROUPS.flatMap((group) => group.items.map((item) => item.href));
