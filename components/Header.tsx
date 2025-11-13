"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeButton } from "@/components/ThemeToggle";

const NAV = [
  { href: "/projects", label: "Projects" },
  { href: "/career", label: "Career" },
  { href: "/about", label: "About" },
] as const;

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-4 z-50">
      <div className="container">
        <div className="relative elevation-2 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[var(--shape-xl)] border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-high)] px-4 py-3 sm:px-6 sm:py-4 backdrop-blur">
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
          <nav className="hidden min-w-0 items-center justify-center gap-1 text-sm sm:gap-2 md:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                isActive={
                  item.href === "/about"
                    ? pathname === "/about"
                    : pathname?.startsWith(item.href)
                }
              />
            ))}
          </nav>
          <div className="justify-self-end flex items-center gap-1">
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="mobile-menu"
              className="btn btn-tonal px-3 py-2 md:hidden"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <CloseIcon className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
            </button>
            <ThemeButton />
          </div>

          {/* Mobile sheet */}
          {open ? (
            <>
              <button
                type="button"
                aria-label="Close menu"
                className="fixed inset-0 z-40 md:hidden"
                onClick={() => setOpen(false)}
              />
              <div className="absolute left-2 right-2 top-[calc(100%+8px)] z-50 md:hidden">
                <div id="mobile-menu" className="card p-2">
                  {NAV.map((item) => {
                    const active =
                      item.href === "/about"
                        ? pathname === "/about"
                        : pathname?.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between rounded-[var(--shape-lg)] px-3 py-3 text-sm font-medium transition hover:bg-[var(--md-surface-container-highest)] ${
                          active ? "text-[var(--md-primary)]" : "text-[var(--md-on-surface)]"
                        }`}
                        onClick={() => setOpen(false)}
                      >
                        <span>{item.label}</span>
                        <span className="text-xs" aria-hidden="true">
                          →
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}
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

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6l-12 12" />
    </svg>
  );
}
