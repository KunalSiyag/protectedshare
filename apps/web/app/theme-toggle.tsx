"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { buttonVariants, cn } from "@protectedshare/ui";

const THEME_KEY = "theme";

function storedTheme(): "dark" | "light" | null {
  try {
    const value = window.localStorage.getItem(THEME_KEY);
    return value === "dark" || value === "light" ? value : null;
  } catch {
    return null;
  }
}

function applyTheme(isDark: boolean) {
  const root = document.documentElement;
  // Switch without every element animating its colors at once.
  root.classList.add("[&_*]:!transition-none");
  root.classList.toggle("dark", isDark);
  window.setTimeout(() => root.classList.remove("[&_*]:!transition-none"), 0);
}

export default function ThemeToggle({ className }: { className?: string }) {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));

    // With no saved choice, keep following the system setting.
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) => {
      if (storedTheme()) return;
      applyTheme(event.matches);
      setIsDark(event.matches);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    applyTheme(next);
    setIsDark(next);
    try {
      window.localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      // Preference just won't persist.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark === null ? "Toggle color theme" : isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light theme" : "Dark theme"}
      className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-ink-3 hover:text-ink", className)}
    >
      {/* Icons swap by CSS so the first paint is right before hydration. */}
      <Moon aria-hidden="true" className="dark:hidden" strokeWidth={1.75} />
      <Sun aria-hidden="true" className="hidden dark:block" strokeWidth={1.75} />
    </button>
  );
}
