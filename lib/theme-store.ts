import { create } from "zustand";

export type Theme = "light" | "dark";

type SetThemeOptions = {
  persist?: boolean;
};

type ThemeStore = {
  theme: Theme;
  setTheme: (theme: Theme, options?: SetThemeOptions) => void;
  initialize: () => void;
};

const isBrowser = typeof window !== "undefined";

const getPreferredTheme = (): Theme => {
  if (!isBrowser) {
    return "light";
  }

  const stored = window.localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const applyThemeToDocument = (theme: Theme) => {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme === "dark" ? "dark" : "light";
  root.classList.toggle("dark", theme === "dark");
};

const persistTheme = (theme: Theme) => {
  if (!isBrowser) {
    return;
  }
  window.localStorage.setItem("theme", theme);
};

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: "light",
  setTheme: (theme, options) => {
    set({ theme });
    applyThemeToDocument(theme);
    if (options?.persist ?? true) {
      persistTheme(theme);
    }
  },
  initialize: () => {
    const resolved = getPreferredTheme();
    set({ theme: resolved });
    applyThemeToDocument(resolved);
  },
}));

export const themeHydrationScript = `(() => {
  try {
    const stored = window.localStorage.getItem("theme");
    let theme = stored === "dark" || stored === "light" ? stored : null;
    if (!theme) {
      theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme === "dark" ? "dark" : "light";
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  } catch (_error) {
    // ignore hydration theme errors
  }
})();`;
