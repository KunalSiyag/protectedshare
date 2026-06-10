"use client";

import { usePathname } from "next/navigation";

export default function WindowHeader() {
  const pathname = usePathname();

  let fileName = "untitled.txt";
  if (pathname.startsWith("/notes/")) {
    fileName = "decrypt_note.md";
  } else if (pathname === "/notes") {
    fileName = "secure_note.md";
  } else if (pathname.startsWith("/secrets/")) {
    fileName = "decrypt_secret.env";
  } else if (pathname === "/secrets") {
    fileName = "one_time_secret.env";
  } else if (pathname === "/notepad") {
    fileName = "local_vault.db";
  } else if (pathname === "/x-formatter") {
    fileName = "ai_formatter.py";
  }

  return (
    <div className="h-10 bg-blue-600 dark:bg-zinc-900/80 border-b border-blue-700 dark:border-zinc-800/60 flex items-center px-4 gap-2 shrink-0 transition-colors duration-300">
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="w-3 h-3 rounded-full bg-white/30 dark:bg-zinc-700/50 border border-white/20 dark:border-zinc-600/50"></div>
        <div className="w-3 h-3 rounded-full bg-white/30 dark:bg-zinc-700/50 border border-white/20 dark:border-zinc-600/50"></div>
        <div className="w-3 h-3 rounded-full bg-white/30 dark:bg-zinc-700/50 border border-white/20 dark:border-zinc-600/50"></div>
      </div>
      <div className="flex-1 text-center text-[11px] font-mono text-blue-100 dark:text-zinc-500 uppercase tracking-widest pointer-events-none select-none">
        {fileName} — ProtectedShare
      </div>
    </div>
  );
}
