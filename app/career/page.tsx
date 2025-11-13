import { data } from "@/lib/data";

export default function Career() {
  return (
    <div className="space-y-10">
      <section className="card relative overflow-hidden p-8 md:p-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[rgba(76,110,245,0.2)] to-transparent" />
        <div className="relative space-y-3">
          <span className="eyebrow">Experience</span>
          <h1 className="text-3xl font-semibold md:text-5xl">
            Career Timeline
          </h1>
          <p className="max-w-2xl text-muted">
            A chronicle of roles focused on ML platforms, data engineering, and
            LLM product delivery across startups and large banks. Each entry is
            a Material surface that captures responsibility, scale, and stack.
          </p>
        </div>
      </section>

      <ol className="relative ps-10">
        <span className="pointer-events-none absolute left-4 top-8 hidden h-[calc(100%-4rem)] w-px bg-gradient-to-b from-[var(--md-primary)] via-[var(--md-tertiary)] to-transparent md:block" />
        {data.timeline.map((entry, index) => (
          <li key={index} className="relative pl-6">
            <span className="pointer-events-none absolute left-1.5 top-12 hidden h-4 w-4 -translate-x-1/2 rounded-full bg-[var(--md-primary)] shadow-[0_0_0_6px_rgba(76,110,245,0.1)] md:block" />
            <article className="card mb-10 border border-[var(--md-outline-variant)] p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h3 className="text-2xl font-semibold text-[var(--md-on-surface)]">
                    {entry.role}
                  </h3>
                  <p className="text-sm font-semibold text-muted">
                    {entry.company}
                  </p>
                </div>
                <div className="text-xs font-semibold uppercase tracking-[0.35em] text-muted">
                  {entry.period}
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                {entry.points.map((point, pointIdx) => (
                  <li key={pointIdx} className="leading-relaxed">
                    {point}
                  </li>
                ))}
              </ul>
              {entry.stack?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {entry.stack.map((tech) => (
                    <span key={tech} className="chip">
                      {tech}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          </li>
        ))}
      </ol>
    </div>
  );
}
