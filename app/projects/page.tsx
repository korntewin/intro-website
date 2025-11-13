import { ProjectCard } from "@/components/ProjectCard";
import { data } from "@/lib/data";

export default function Projects() {
  return (
    <div className="space-y-10">
      <section className="card relative overflow-hidden p-8 md:p-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[rgba(76,110,245,0.2)] to-transparent" />
        <div className="relative space-y-4">
          <span className="eyebrow">Selected Work</span>
          <h1 className="text-3xl font-semibold leading-tight md:text-5xl">
            Projects & Experiments
          </h1>
          <p className="max-w-2xl text-muted">
            A snapshot of platforms, agents, and data systems I have shipped
            recently—from Rust-first services to large-scale streaming and LLM
            orchestration. Material surfaces highlight the most expressive
            builds.
          </p>
        </div>
      </section>
      <section className="grid gap-6 md:grid-cols-2">
        {data.projects.map((project) => (
          <ProjectCard key={project.title} project={project} />
        ))}
      </section>
    </div>
  );
}
