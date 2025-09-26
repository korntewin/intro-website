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
      className="btn px-4 py-1.5 text-xs"
      aria-label="Toggle theme"
      aria-pressed={isDark}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <span aria-hidden="true">{isDark ? "☀️" : "🌙"}</span>
      <span>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
