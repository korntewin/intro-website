"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeButton } from "@/components/ThemeToggle";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-4 z-50">
      <div className="container">
        <div className="elevation-2 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[var(--shape-xl)] border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-high)] px-4 py-3 sm:px-6 sm:py-4 backdrop-blur">
          <div className="flex items-center gap-3 min-w-0">
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
          <nav className="min-w-0 flex items-center justify-center gap-1 text-sm sm:gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none]">
            {/* hide native scrollbar in WebKit */}
            <style jsx>{`
              nav::-webkit-scrollbar { display: none; }
            `}</style>
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
          </nav>
          <div className="justify-self-end">
            <ThemeButton />
          </div>
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
