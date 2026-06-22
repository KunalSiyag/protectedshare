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
    <div className="h-10 bg-zinc-50/90 dark:bg-[#0b0b0c]/80 border-b border-zinc-200 dark:border-zinc-800/60 flex items-center px-4 gap-2 shrink-0 transition-colors duration-300">
      <div className="flex items-center gap-1.5 shrink-0 select-none">
        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-[#e0443e]"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-[#dea123]"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-[#1aab29]"></div>
      </div>
      <div className="flex-1 text-center text-[10px] font-mono text-zinc-500 dark:text-zinc-550 uppercase tracking-widest pointer-events-none select-none">
        {fileName} — ProtectedShare
      </div>
    </div>
  );
}
