"use client";

import { useEffect, useState } from "react";
import AppLink from "../components/app-link";
import ThemeToggle from "./theme-toggle";
import MobileNav from "./mobile-nav";

export default function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-[height,background-color,border-color,box-shadow] duration-300 ease-in-out ${
        isScrolled
          ? "border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_30px_-15px_rgba(0,0,0,0.3)] h-14"
          : "border-b border-transparent bg-transparent h-16"
      }`}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 h-full flex items-center justify-between">
        <AppLink
          href="/"
          className="font-semibold tracking-tight flex items-center gap-2 shrink-0 text-zinc-900 dark:text-zinc-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-blue-600 dark:text-emerald-500">
            <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
          </svg>
          <span className="text-sm sm:text-base">ProtectedShare</span>
        </AppLink>

        <div className="hidden md:flex items-center gap-6">
          <nav className="flex items-center gap-5 text-sm font-medium text-zinc-550 dark:text-zinc-400">
            <AppLink href="/notes" className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">
              Secure Notes
            </AppLink>
            <AppLink href="/secrets" className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">
              EnvShare
            </AppLink>
            <AppLink href="/notepad" className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">
              Notepad
            </AppLink>
            <AppLink href="/blog" className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">
              Blog
            </AppLink>
            <AppLink href="/self-host" className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">
              Self-Host
            </AppLink>
            <AppLink href="/chat" className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors">
              Chat
            </AppLink>
          </nav>
          <ThemeToggle />
        </div>

        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
