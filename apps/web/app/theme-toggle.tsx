"use client";

import { useEffect, useState } from "react";

const THEME_KEY = "theme";

function getInitialTheme(): boolean {
  const storedTheme = window.localStorage.getItem(THEME_KEY);
  if (storedTheme === "dark") return true;
  if (storedTheme === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function setTheme(isDark: boolean): void {
  document.documentElement.classList.toggle("dark", isDark);
  window.localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
}

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const dark = getInitialTheme();
    setTheme(dark);
    setIsDark(dark);
    setMounted(true);
  }, []);

  const handleToggle = () => {
    const nextValue = !isDark;
    setTheme(nextValue);
    setIsDark(nextValue);
  };

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={handleToggle}
      disabled={!mounted}
      className="inline-flex items-center gap-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors disabled:opacity-60"
    >
      <span aria-hidden="true">{isDark ? "🌙" : "☀️"}</span>
      {isDark ? "Dark" : "Light"}
    </button>
  );
}
