export function Footer() {
  return (
    <footer className="mt-20 pb-10">
      <div className="container">
        <div className="card flex flex-col gap-6 px-6 py-8 text-sm md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="eyebrow">Stay Connected</div>
            <div className="text-lg font-semibold">
              © {new Date().getFullYear()} Korntewin Boonchuay
            </div>
            <p className="text-sm text-muted">
              Crafting adaptive ML systems with Material-first precision.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-muted">
            <FooterLink href="https://github.com/korntewin">GitHub</FooterLink>
            <FooterLink href="https://korntewin-b.medium.com">
              Medium
            </FooterLink>
            <FooterLink href="https://www.linkedin.com/in/korntewin">
              LinkedIn
            </FooterLink>
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
      className="chip chip-elevated hover:translate-y-[-1px] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--md-primary)]"
    >
      <span>{children}</span>
      <span className="text-xs" aria-hidden="true">
        ↗
      </span>
    </a>
  );
}
