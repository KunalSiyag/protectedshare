"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./theme-toggle";
import MobileNav from "./mobile-nav";
import WindowHeader from "./window-header";
import ContactModal from "./contact-modal";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [contactOpen, setContactOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  const triggerContact = (e: React.MouseEvent) => {
    e.preventDefault();
    setContactOpen(true);
  };

  return (
    <>
      {/* ═══ Sticky Header / Navbar ═══ */}
      <header className={`border-b border-zinc-200 dark:border-zinc-800/60 bg-white/80 dark:bg-black/50 backdrop-blur-sm sticky top-0 z-50 transition-colors duration-300 ${isHome ? "bg-zinc-950/80 dark:bg-black/50 border-zinc-900/60" : ""}`}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className={`font-semibold tracking-tight flex items-center gap-2 shrink-0 ${isHome ? "text-white" : "text-zinc-900 dark:text-zinc-100"}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-blue-600 dark:text-emerald-500">
              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
            </svg>
            <span className="text-sm sm:text-base">ProtectedShare</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <nav className={`flex items-center gap-5 text-sm font-medium ${isHome ? "text-zinc-400" : "text-zinc-500 dark:text-zinc-400"}`}>
              <Link href="/notes" className={`hover:text-blue-600 dark:hover:text-zinc-100 transition-colors ${isHome ? "hover:text-white" : ""}`}>
                Secure Notes
              </Link>
              <Link href="/secrets" className={`hover:text-blue-600 dark:hover:text-zinc-100 transition-colors ${isHome ? "hover:text-white" : ""}`}>
                EnvShare
              </Link>
              <Link href="/notepad" className={`hover:text-blue-600 dark:hover:text-zinc-100 transition-colors ${isHome ? "hover:text-white" : ""}`}>
                Notepad
              </Link>
            </nav>
            <ThemeToggle />
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <MobileNav />
          </div>
        </div>
      </header>

      {/* ═══ Main Content Area ═══ */}
      {isHome ? (
        <div className="flex-1 w-full bg-zinc-950 text-zinc-100 flex flex-col animate-in fade-in duration-300">
          <div className="flex-1 w-full max-w-5xl mx-auto p-0 flex flex-col">
            {children}
          </div>
        </div>
      ) : (
        <div className="flex-1 w-full max-w-5xl mx-auto p-3 sm:p-4 md:p-8 flex flex-col animate-in fade-in duration-300">
          <div className="flex-1 bg-white dark:bg-zinc-950/40 border border-zinc-300 dark:border-zinc-800/60 rounded-xl shadow-lg dark:shadow-2xl overflow-hidden flex flex-col backdrop-blur-sm relative transition-colors duration-300">
            {/* Notepad Window Header */}
            <WindowHeader />
            {/* Dynamic Page Content */}
            <div className="flex-1 overflow-x-hidden text-zinc-800 dark:text-zinc-300">
              {children}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Persistent Global Footer ═══ */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800/60 bg-zinc-100 dark:bg-[#09090b] pt-12 md:pt-16 pb-16 md:pb-24 mt-auto transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-24">
          <div>
            <h3 className="text-zinc-900 dark:text-zinc-100 font-semibold mb-5 flex items-center gap-2 text-base md:text-lg">
              <span className="text-blue-600 dark:text-emerald-500 font-mono">{"/*"}</span> Cryptographic Core
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
              ProtectedShare is engineered with an absolute zero-knowledge security model.
              Your plaintext is encrypted natively in your browser using AES-256-GCM.
              Because the encryption/decryption keys are held strictly by you, it is <strong className="text-zinc-900 dark:text-zinc-200 font-semibold">cryptographically impossible</strong> for hackers, third parties, or even our administrators to read your secrets, workspaces, or notes.
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
              We provide two distinct, purpose-built sharing protocols:
            </p>
            <ul className="text-sm space-y-3 mb-6 pl-1">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-emerald-500 font-mono mt-0.5">-</span>
                <span className="text-zinc-600 dark:text-zinc-400"><strong className="text-zinc-900 dark:text-zinc-200 font-medium">One-Time Secrets:</strong> Passes the decryption key securely via the URL hash fragment (`#key`). The key never hits the network, and the payload burns immediately after one-time access, preventing residual chat/mail log leakage.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-emerald-500 font-mono mt-0.5">-</span>
                <span className="text-zinc-600 dark:text-zinc-400"><strong className="text-zinc-900 dark:text-zinc-200 font-medium">Secure Notes:</strong> Outputs a separated link and password. This allows you to split the delivery across two independent channels (e.g., URL over Slack, password via Signal/SMS), satisfying strict multi-factor defense requirements.</span>
              </li>
            </ul>
          </div>
          <div className="flex flex-col justify-between">
            <div>
              <h3 className="text-zinc-900 dark:text-zinc-100 font-semibold mb-5 flex items-center gap-2 text-base md:text-lg">
                <span className="text-blue-600 dark:text-emerald-500 font-mono">{"*"}</span> Zero-Trust Security Protocols
              </h3>
              <ul className="text-sm space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-blue-100 dark:bg-emerald-500/10 p-1 shrink-0">
                    <svg className="w-3.5 h-3.5 text-blue-600 dark:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <span className="text-zinc-600 dark:text-zinc-400"><strong className="text-zinc-900 dark:text-zinc-200 font-medium">Unhackable At Rest:</strong> Even in the event of a full server database breach, your notes and credentials remain mathematically secure because they are stored strictly in an encrypted blob format.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-blue-100 dark:bg-emerald-500/10 p-1 shrink-0">
                    <svg className="w-3.5 h-3.5 text-blue-600 dark:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <span className="text-zinc-600 dark:text-zinc-400"><strong className="text-zinc-900 dark:text-zinc-200 font-medium">True Zero-Tracking:</strong> No analytical beacons, no cookied trackers, and absolutely no signup required. Your sharing session remains fully anonymous.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-blue-100 dark:bg-emerald-500/10 p-1 shrink-0">
                    <svg className="w-3.5 h-3.5 text-blue-600 dark:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <span className="text-zinc-600 dark:text-zinc-400"><strong className="text-zinc-900 dark:text-zinc-200 font-medium">Edge-Native Isolation:</strong> Runs entirely on Cloudflare&apos;s globally distributed Edge Network, delivering blazing-fast sub-millisecond encryption checks without regional lags.</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 p-4 rounded-lg bg-zinc-200/40 dark:bg-zinc-900/60 border border-zinc-300 dark:border-zinc-800/80 transition-colors duration-300">
              <h4 className="text-xs uppercase font-mono tracking-wider text-zinc-900 dark:text-zinc-200 font-semibold mb-2">Dedicated Infrastructure</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Need a completely isolated, private, and customizable zero-knowledge infrastructure for your enterprise? We design and deploy dedicated setups.{" "}
                <button
                  onClick={triggerContact}
                  className="text-blue-600 dark:text-emerald-400 hover:underline font-bold transition-all focus:outline-none"
                >
                  Let&apos;s make a deal
                </button>
                .
              </p>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-12 md:mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800/40 text-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-600 font-mono">
            © {new Date().getFullYear()} ProtectedShare.me — Zero-Knowledge Security Protocols.
          </p>
        </div>
      </footer>

      {/* Global Contact Form Drawer */}
      <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
}
