import {
  Binary,
  Braces,
  FileLock,
  FileUp,
  Gauge,
  Inbox,
  KeyRound,
  KeySquare,
  LockKeyhole,
  MessagesSquare,
  NotebookPen,
  ShieldAlert,
  Wifi,
  type LucideIcon,
  Plug,
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
  /** A "see all" link under the items, for groups that show only a few of their entries. */
  more?: { href: string; label: string };
  /** Show the items as single lines (no description) in the desktop menu. */
  compact?: boolean;
};

/** Every free tool, in the order the /tools index lists them. */
export const FREE_TOOLS: NavProduct[] = [
  {
    href: "/tools/password-generator",
    label: "Password generator",
    description: "Passwords and passphrases, generated locally.",
    icon: LockKeyhole,
  },
  {
    href: "/tools/password-strength-checker",
    label: "Password strength checker",
    description: "How guessable a password is, with reasons.",
    icon: Gauge,
  },
  {
    href: "/tools/breached-password-checker",
    label: "Breached password checker",
    description: "Check a password against known breaches, privately.",
    icon: ShieldAlert,
  },
  {
    href: "/tools/secret-key-generator",
    label: "Secret key generator",
    description: "Random keys for .env files, JWTs, Django and Rails.",
    icon: KeySquare,
  },
  {
    href: "/tools/jwt-decoder",
    label: "JWT decoder",
    description: "Read a token's claims and check its signature locally.",
    icon: Braces,
  },
  {
    href: "/tools/wifi-qr-code-generator",
    label: "WiFi QR code generator",
    description: "A code guests scan to join your network.",
    icon: Wifi,
  },
  {
    href: "/tools/encrypt-text",
    label: "Encrypt text",
    description: "Lock text into a block only a password opens.",
    icon: Binary,
  },
];

/** The free tools the Products menu shows by name; the rest sit behind "All free tools". */
const FEATURED_FREE_TOOLS = ["/tools/password-generator", "/tools/secret-key-generator", "/tools/breached-password-checker"];

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
    label: "Integrations",
    items: [
      { href: "/integrations/claude", label: "Claude connector", description: "Create secret links from Claude, over MCP.", icon: Plug },
    ],
  },
  {
    label: "Free tools",
    items: FEATURED_FREE_TOOLS.map((href) => FREE_TOOLS.find((tool) => tool.href === href)).filter(
      (tool): tool is NavProduct => Boolean(tool)
    ),
    more: { href: "/tools", label: `All ${FREE_TOOLS.length} free tools` },
    compact: true,
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

/** Paths that light up the Products menu: every listed product, plus /tools and every tool under it. */
export const PRODUCT_HREFS = PRODUCT_GROUPS.flatMap((group) => [
  ...group.items.map((item) => item.href),
  ...(group.more ? [group.more.href] : []),
]);
