"use client";

import { usePathname } from "next/navigation";

/**
 * Pages render straight onto the canvas. Non-home pages get the content width and gutters;
 * the homepage controls its own full-bleed layout. The notepad workspace opts out of the width
 * by putting `.notepad-full-width` on <html>.
 */
export default function PageFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/") {
    return (
      <div id="main-content" tabIndex={-1} className="flex w-full flex-1 flex-col outline-none">
        {children}
      </div>
    );
  }

  return (
    <div
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-content flex-1 flex-col px-4 pb-16 pt-8 outline-none sm:px-6 md:pt-12 [.notepad-full-width_&]:max-w-none [.notepad-full-width_&]:px-2 [.notepad-full-width_&]:pb-4 [.notepad-full-width_&]:pt-4 sm:[.notepad-full-width_&]:px-4 md:[.notepad-full-width_&]:px-6"
    >
      {children}
    </div>
  );
}
