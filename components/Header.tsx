"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeButton } from "@/components/ThemeToggle";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-4 z-50">
      <div className="container">
        <div className="group relative flex items-center justify-between overflow-hidden rounded-full border border-white/40 bg-white/70 px-5 py-3 text-sm backdrop-blur dark:border-white/10 dark:bg-white/10">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-sky-500/15 via-transparent to-emerald-400/20 opacity-0 transition group-hover:opacity-100" />
          <div className="relative flex items-center gap-3">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.7)]" />
            <Link href="/" className="font-medium tracking-wide">
              Korntewin Boonchuay
            </Link>
          </div>
          <nav className="relative flex items-center gap-4">
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
}: {
  href: string;
  label: string;
  isActive?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative inline-flex items-center gap-2 rounded-full px-3 py-1 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
        isActive ? "text-sky-500" : "hover:text-sky-500"
      }`}
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
