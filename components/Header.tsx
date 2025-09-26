"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { ThemeButton } from "@/components/ThemeToggle";

const navItems = [
  {
    href: "/projects",
    label: "Projects",
    isActive: (pathname: string | null) => pathname?.startsWith("/projects"),
  },
  {
    href: "/career",
    label: "Career",
    isActive: (pathname: string | null) => pathname?.startsWith("/career"),
  },
  {
    href: "/about",
    label: "About",
    isActive: (pathname: string | null) => pathname === "/about",
  },
];

export function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-4 z-50">
      <div className="container">
        <div
          className={`group relative overflow-hidden border border-white/40 bg-white/70 px-5 py-3 text-sm backdrop-blur transition-[border-radius] dark:border-white/10 dark:bg-white/10 ${
            isMenuOpen ? "rounded-2xl" : "rounded-full"
          }`}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-sky-500/15 via-transparent to-emerald-400/20 opacity-0 transition group-hover:opacity-100" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.7)]" />
              <Link href="/" className="font-medium tracking-wide">
                Korntewin Boonchuay
              </Link>
            </div>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/50 text-base text-slate-600 transition hover:bg-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20 md:hidden"
              aria-label="Toggle navigation"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setIsMenuOpen((previous) => !previous)}
            >
              <span className="relative block h-4 w-4">
                <span
                  className={`absolute inset-x-0 top-0 h-0.5 rounded-full bg-current transition-transform duration-300 ${
                    isMenuOpen ? "translate-y-1.5 rotate-45" : ""
                  }`}
                />
                <span
                  className={`absolute inset-x-0 top-1.5 h-0.5 rounded-full bg-current transition-opacity duration-200 ${
                    isMenuOpen ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`absolute inset-x-0 top-3 h-0.5 rounded-full bg-current transition-transform duration-300 ${
                    isMenuOpen ? "-translate-y-1.5 -rotate-45" : ""
                  }`}
                />
              </span>
            </button>
            <nav className="hidden items-center gap-4 md:flex">
              {navItems.map(({ href, label, isActive }) => (
                <NavLink
                  key={href}
                  href={href}
                  label={label}
                  isActive={isActive(pathname)}
                />
              ))}
              <ThemeButton />
            </nav>
          </div>
          <nav
            id="mobile-navigation"
            className={`relative mt-3 flex-col gap-2 border-t border-white/40 pt-3 transition-all duration-200 dark:border-white/10 md:hidden ${
              isMenuOpen
                ? "flex opacity-100"
                : "hidden -translate-y-2 opacity-0"
            }`}
            aria-hidden={!isMenuOpen}
          >
            {navItems.map(({ href, label, isActive }) => (
              <NavLink
                key={href}
                href={href}
                label={label}
                isActive={isActive(pathname)}
                onClick={() => setIsMenuOpen(false)}
              />
            ))}
            <ThemeButton />
          </nav>
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  label,
  isActive,
  onClick,
}: {
  href: string;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      className={`group relative inline-flex items-center gap-2 rounded-full px-3 py-1 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
        isActive ? "text-sky-500" : "hover:text-sky-500"
      }`}
      onClick={onClick}
    >
      <span
        className={`pointer-events-none absolute inset-x-1 top-full h-px origin-left bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-400 transition-transform duration-300 ${
          isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
        }`}
      />
      <span>{label}</span>
    </Link>
  );
}
