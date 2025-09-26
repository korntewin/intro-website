import Link from "next/link";
import Image from "next/image";

export type Project = {
  title: string;
  description: string;
  tags: readonly string[];
  links?: readonly { label: string; href: string }[];
  image?: string;
};

export function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="group relative h-full">
      <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-br from-sky-500/25 via-transparent to-emerald-400/20 opacity-0 blur-2xl transition duration-500 group-hover:opacity-70" />
      <div className="card relative h-full overflow-hidden p-0">
        {project.image ? (
          <Image
            src={project.image}
            alt={project.title}
            className="h-44 w-full object-cover"
            width={920}
            height={500}
          />
        ) : (
          <div className="h-2 w-full bg-gradient-to-r from-sky-400/80 via-blue-500/60 to-emerald-400/80" />
        )}

        <div className="relative flex h-full flex-col gap-6 p-7">
          <div className="pointer-events-none absolute -top-28 right-0 h-48 w-48 rounded-full bg-sky-400/15 blur-3xl transition group-hover:translate-y-4" />
          <div className="pointer-events-none absolute -bottom-28 left-20 h-44 w-44 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-muted">
              {project.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/25 px-3 py-1 text-[10px] tracking-[0.3em] text-slate-900/70 dark:text-slate-200/80"
                >
                  {tag}
                </span>
              ))}
              {project.tags.length > 2 ? (
                <span className="rounded-full border border-white/25 px-3 py-1 text-[10px] tracking-[0.3em] text-slate-900/60 dark:text-slate-200/65">
                  +{project.tags.length - 2}
                </span>
              ) : null}
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-semibold leading-tight text-slate-900 dark:text-slate-100">
                {project.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted md:text-base">
                {project.description}
              </p>
            </div>
          </div>

          <div className="mt-auto space-y-4">
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span key={tag} className="badge">
                  {tag}
                </span>
              ))}
            </div>
            {project.links?.length ? (
              <div className="flex flex-wrap gap-3 pt-1">
                {project.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="btn group/link text-sm"
                  >
                    <span>{link.label}</span>
                    <span className="transition group-hover/link:translate-x-1">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
