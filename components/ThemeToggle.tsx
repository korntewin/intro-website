"use client";

import { useEffect, type ReactNode } from "react";
import { useThemeStore } from "@/lib/theme-store";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const initialize = useThemeStore((state) => state.initialize);
  const setTheme = useThemeStore((state) => state.setTheme);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "theme") {
        if (event.newValue === "dark" || event.newValue === "light") {
          setTheme(event.newValue, { persist: false });
        }
      }
    };

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMedia = (event: MediaQueryListEvent) => {
      if (!window.localStorage.getItem("theme")) {
        setTheme(event.matches ? "dark" : "light", { persist: false });
      }
    };

    window.addEventListener("storage", handleStorage);

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", handleMedia);
    } else if (typeof media.addListener === "function") {
      media.addListener(handleMedia);
    }

    return () => {
      window.removeEventListener("storage", handleStorage);
      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", handleMedia);
      } else if (typeof media.removeListener === "function") {
        media.removeListener(handleMedia);
      }
    };
  }, [setTheme]);

  return <>{children}</>;
}

export function ThemeButton() {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="btn btn-tonal justify-between px-3 py-2 sm:min-w-[120px]"
      aria-label="Toggle theme"
      aria-pressed={isDark}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <span className="flex items-center gap-2">
        {isDark ? (
          <SunIcon className="h-4 w-4 text-[var(--md-on-secondary-container)]" />
        ) : (
          <MoonIcon className="h-4 w-4 text-[var(--md-on-secondary-container)]" />
        )}
        <span className="hidden text-sm font-semibold tracking-tight sm:inline">
          {isDark ? "Light" : "Dark"} Mode
        </span>
      </span>
      <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-[0.35em] text-muted">
        Toggle
      </span>
    </button>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2v2.4M12 19.6V22M4.4 4.4l1.7 1.7M17.9 17.9l1.7 1.7M2 12h2.4M19.6 12H22M4.4 19.6l1.7-1.7M17.9 6.1l1.7-1.7" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className={className}
    >
      <path d="M20.4 15A8.4 8.4 0 0 1 9 3.6a8.41 8.41 0 1 0 11.4 11.4Z" />
    </svg>
  );
}
