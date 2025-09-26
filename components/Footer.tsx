export function Footer() {
  return (
    <footer className="mt-20 pb-10">
      <div className="container">
        <div className="group relative overflow-hidden rounded-[28px] border border-white/40 bg-white/70 px-6 py-8 text-sm backdrop-blur dark:border-white/10 dark:bg-white/10">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-sky-500/15 via-transparent to-emerald-400/20 opacity-0 transition group-hover:opacity-100" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-[0.35em] text-muted">
                Stay Connected
              </div>
              <div className="text-base font-medium">
                © {new Date().getFullYear()} Korntewin Boonchuay
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-muted">
              <FooterLink href="https://github.com/korntewin">
                GitHub
              </FooterLink>
              <FooterLink href="https://korntewin-b.medium.com">
                Medium
              </FooterLink>
              <FooterLink href="https://www.linkedin.com/in/korntewin">
                LinkedIn
              </FooterLink>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-1 transition hover:border-sky-400 hover:text-sky-500 dark:border-white/20"
    >
      <span>{children}</span>
      <span className="text-xs">↗</span>
    </a>
  );
}
