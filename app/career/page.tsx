import { data } from "@/lib/data";

export default function Career() {
  return (
    <div className="space-y-12">
      <div className="card relative overflow-hidden p-8">
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="relative space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-1 text-[11px] uppercase tracking-[0.35em] text-muted dark:border-white/10">
            Experience
          </span>
          <h1 className="text-3xl font-semibold md:text-5xl">
            Career Timeline
          </h1>
          <p className="max-w-2xl text-muted">
            A chronicle of roles focused on ML platforms, data engineering, and
            LLM product delivery across startups and large banks.
          </p>
        </div>
      </div>
      <ol className="relative ps-10">
        <span className="pointer-events-none absolute left-4 top-8 h-[calc(100%-4rem)] w-px bg-gradient-to-b from-sky-400 via-cyan-400 to-emerald-400" />
        {data.timeline.map((entry, index) => (
          <li key={index} className="relative pl-6">
            <div className="absolute left-1.5 top-12 h-6 w-6 -translate-x-1/2 rounded-full border border-white/50 bg-white/80 shadow-[0_0_12px_rgba(59,130,246,0.45)] dark:border-white/20 dark:bg-white/10" />
            <div className="card relative mb-10 overflow-hidden rounded-[24px] p-8">
              <div className="pointer-events-none absolute -right-24 top-0 h-56 w-56 rounded-full bg-sky-400/15 blur-3xl" />
              <div className="relative space-y-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
                  <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    {entry.role} · {entry.company}
                  </h3>
                  <div className="text-sm uppercase tracking-[0.3em] text-muted">
                    {entry.period}
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-muted">
                  {entry.points.map((point, pointIdx) => (
                    <li key={pointIdx} className="leading-relaxed">
                      {point}
                    </li>
                  ))}
                </ul>
                {entry.stack?.length ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {entry.stack.map((tech) => (
                      <span key={tech} className="badge">
                        {tech}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
