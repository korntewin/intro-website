import { ProjectCard } from "@/components/ProjectCard";
import { data } from "@/lib/data";

export default function Projects() {
  return (
    <div className="space-y-12">
      <div className="card relative overflow-hidden p-8">
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-60 w-60 rounded-full bg-slate-600/15 blur-3xl" />
        <div className="relative space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-1 text-[11px] uppercase tracking-[0.35em] text-muted dark:border-white/10">
            Selected Work
          </span>
          <h1 className="text-3xl font-semibold md:text-5xl">
            Projects & Experiments
          </h1>
          <p className="max-w-2xl text-muted">
            A snapshot of platforms, agents, and data systems I have shipped
            recently—from Rust-first services to large-scale streaming and LLM
            orchestration.
          </p>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {data.projects.map((project) => (
          <ProjectCard key={project.title} project={project} />
        ))}
      </div>
    </div>
  );
}
