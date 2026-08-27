"use client";

import { usePathname } from "next/navigation";
import WindowHeader from "./window-header";

export default function PageFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  if (isHome) {
    return (
      <div className="flex-1 w-full bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-300 flex flex-col">
        <div className="flex-1 w-full max-w-5xl mx-auto p-0 flex flex-col">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-5xl [.notepad-full-width_&]:max-w-none [.notepad-full-width_&]:px-2 [.notepad-full-width_&]:sm:px-4 [.notepad-full-width_&]:md:px-6 [.notepad-full-width_&]:py-4 p-3 sm:p-4 md:p-8 mx-auto flex flex-col">
      <div className="flex-1 bg-white dark:bg-[#09090b]/80 border border-zinc-200 dark:border-zinc-800/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] overflow-hidden flex flex-col relative">
        <WindowHeader />
        <div className="flex-1 overflow-x-hidden text-zinc-800 dark:text-zinc-300">
          {children}
        </div>
      </div>
    </div>
  );
}
