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
        <div className="elevation-2 flex flex-wrap items-center justify-between gap-4 rounded-[var(--shape-xl)] border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-high)] px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--md-primary-container)] text-sm font-semibold text-[var(--md-on-primary-container)] shadow-sm">
              KB
            </span>
            <div className="flex flex-col">
              <Link href="/" className="text-base font-semibold tracking-tight">
                Korntewin Boonchuay
              </Link>
              <span className="text-xs font-medium uppercase tracking-[0.3em] text-muted">
                Rust-first · ML Systems
              </span>
            </div>
          </div>
          <nav className="flex items-center gap-2 text-sm">
            <NavLink
              href="/projects"
              label="Projects"
              isActive={pathname?.startsWith("/projects")}
            />
            <NavLink
              href="/career"
              label="Career"
              isActive={pathname?.startsWith("/career")}
            />
            <NavLink
              href="/about"
              label="About"
              isActive={pathname === "/about"}
            />
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
      className={`group relative inline-flex items-center rounded-full px-4 py-2 font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--md-primary)] ${
        isActive
          ? "text-[var(--md-primary)]"
          : "text-muted hover:text-[var(--md-primary)]"
      }`}
      onClick={onClick}
    >
      <span
        className={`pointer-events-none absolute inset-x-2 bottom-1 h-1 rounded-full bg-[var(--md-primary)] transition ${
          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"
        }`}
      />
      <span>{label}</span>
    </Link>
  );
}
