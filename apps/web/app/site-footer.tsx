import AppLink from "../components/app-link";
import ContactTrigger from "../components/contact-trigger";

const toolLinks = [
  { href: "/notes", label: "Secure Notes" },
  { href: "/secrets", label: "EnvShare" },
  { href: "/notepad", label: "Encrypted Notepad" },
  { href: "/chat", label: "Anonymous Chatroom" },
] as const;

const comparisonLinks = [
  { href: "/vs/protectedtext", label: "ProtectedText Alternative" },
  { href: "/vs/privnote", label: "Privnote Alternative" },
  { href: "/vs/envshare", label: "EnvShare Alternative" },
] as const;

const guideLinks = [
  { href: "/blog", label: "Security Blog" },
  { href: "/self-host", label: "Self-Host" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact Us" },
] as const;

export default function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800/60 bg-zinc-100 dark:bg-[#09090b] pt-12 md:pt-16 pb-16 md:pb-24 mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
        <div>
          <h3 className="text-zinc-900 dark:text-zinc-100 font-semibold mb-5 flex items-center gap-2 text-base md:text-lg">
            <span className="text-blue-600 dark:text-emerald-500 font-mono">{"/*"}</span> Cryptographic Core
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            ProtectedShare encrypts plaintext in your browser with AES-256-GCM. Keys never leave the device, so the
            server only stores ciphertext.
          </p>
          <ul className="text-sm space-y-3 pl-1">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-emerald-500 font-mono mt-0.5">-</span>
              <span className="text-zinc-600 dark:text-zinc-400">
                <strong className="text-zinc-900 dark:text-zinc-200 font-medium">One-time secrets:</strong> key stays in
                the URL hash and the payload can burn after a read.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-emerald-500 font-mono mt-0.5">-</span>
              <span className="text-zinc-600 dark:text-zinc-400">
                <strong className="text-zinc-900 dark:text-zinc-200 font-medium">Secure notes:</strong> send the link and
                password on separate channels.
              </span>
            </li>
          </ul>
        </div>
        <div className="flex flex-col gap-8">
          <div>
            <h3 className="text-zinc-900 dark:text-zinc-100 font-semibold mb-5 flex items-center gap-2 text-base md:text-lg">
              <span className="text-blue-600 dark:text-emerald-500 font-mono">{"<>"}</span> Tools
            </h3>
            <ul className="space-y-3 text-sm">
              {toolLinks.map((link) => (
                <li key={link.href}>
                  <AppLink href={link.href} className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">
                    {link.label}
                  </AppLink>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-zinc-900 dark:text-zinc-100 font-semibold mb-5 flex items-center gap-2 text-base md:text-lg">
              <span className="text-blue-600 dark:text-emerald-500 font-mono">{"{ }"}</span> Comparisons
            </h3>
            <ul className="space-y-3 text-sm">
              {comparisonLinks.map((link) => (
                <li key={link.href}>
                  <AppLink href={link.href} className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">
                    {link.label}
                  </AppLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <h3 className="text-zinc-900 dark:text-zinc-100 font-semibold mb-5 flex items-center gap-2 text-base md:text-lg">
            <span className="text-blue-600 dark:text-emerald-500 font-mono">{"*"}</span> Security
          </h3>
          <ul className="text-sm space-y-4">
            <li className="text-zinc-600 dark:text-zinc-400">
              <strong className="text-zinc-900 dark:text-zinc-200 font-medium">Encrypted at rest.</strong> A database
              dump is ciphertext without your password.
            </li>
            <li className="text-zinc-600 dark:text-zinc-400">
              <strong className="text-zinc-900 dark:text-zinc-200 font-medium">No accounts required.</strong> Sharing
              sessions stay anonymous.
            </li>
            <li className="text-zinc-600 dark:text-zinc-400">
              <strong className="text-zinc-900 dark:text-zinc-200 font-medium">Edge-hosted API.</strong> Secrets and notes
              are served from Cloudflare Workers.
            </li>
          </ul>
        </div>
        <div className="flex flex-col justify-between">
          <div>
            <h3 className="text-zinc-900 dark:text-zinc-100 font-semibold mb-5 flex items-center gap-2 text-base md:text-lg">
              <span className="text-blue-600 dark:text-emerald-500 font-mono">{"//"}</span> Guides
            </h3>
            <ul className="space-y-3 text-sm">
              {guideLinks.map((link) => (
                <li key={link.href}>
                  <AppLink href={link.href} className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">
                    {link.label}
                  </AppLink>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-8 p-4 rounded-lg bg-zinc-200/40 dark:bg-zinc-900/60 border border-zinc-300 dark:border-zinc-800/80">
            <h4 className="text-xs uppercase font-mono tracking-wider text-zinc-900 dark:text-zinc-200 font-semibold mb-2">Dedicated Infrastructure</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Need an isolated zero-knowledge setup?{" "}
              <ContactTrigger className="text-blue-600 dark:text-emerald-400 hover:underline font-bold focus:outline-none">
                Let&apos;s make a deal
              </ContactTrigger>
              .
            </p>
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-12 md:mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800/40 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <p className="text-xs text-zinc-600 dark:text-zinc-550 font-mono order-2 sm:order-1">
          © {new Date().getFullYear()} ProtectedShare.me — Zero-Knowledge Security Protocols.
        </p>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-mono text-zinc-600 dark:text-zinc-400 order-1 sm:order-2">
          <AppLink href="/about" className="hover:text-zinc-950 dark:hover:text-zinc-200 transition-colors">About Us</AppLink>
          <AppLink href="/contact" className="hover:text-zinc-950 dark:hover:text-zinc-200 transition-colors">Contact Us</AppLink>
          <AppLink href="/blog" className="hover:text-zinc-950 dark:hover:text-zinc-200 transition-colors">Blog</AppLink>
          <AppLink href="/self-host" className="hover:text-zinc-950 dark:hover:text-zinc-200 transition-colors">Self-Host</AppLink>
          <AppLink href="/chat" className="hover:text-zinc-950 dark:hover:text-zinc-200 transition-colors">Chatroom</AppLink>
          <AppLink href="/privacy" className="hover:text-zinc-950 dark:hover:text-zinc-200 transition-colors">Privacy Policy</AppLink>
          <AppLink href="/terms" className="hover:text-zinc-950 dark:hover:text-zinc-200 transition-colors">Terms of Service</AppLink>
        </div>
      </div>
    </footer>
  );
}
