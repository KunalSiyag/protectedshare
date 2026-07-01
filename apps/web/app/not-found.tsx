"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Redirect unknown paths directly to the offline-first scratchpad page
    router.replace("/notepad");
  }, [router]);

  return (
    <main className="max-w-3xl mx-auto px-6 py-20 md:py-28 text-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 dark:border-emerald-400 border-t-transparent" />
        <p className="text-sm font-mono text-zinc-500 dark:text-zinc-400">
          Redirecting to scratchpad...
        </p>
      </div>
    </main>
  );
}
