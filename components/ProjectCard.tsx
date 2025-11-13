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
  const preview = project.image;

  return (
    <article className="card h-full overflow-hidden">
      {preview ? (
        <Image
          src={preview}
          alt={project.title}
          className="h-48 w-full object-cover"
          width={920}
          height={500}
        />
      ) : (
        <div className="h-2 w-full bg-gradient-to-r from-[var(--md-primary)] via-[var(--md-tertiary)] to-transparent" />
      )}

      <div className="flex h-full flex-col gap-5 p-6">
        <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-muted">
          {project.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="chip chip-elevated text-[10px] uppercase"
            >
              {tag}
            </span>
          ))}
          {project.tags.length > 2 ? (
            <span className="chip text-[10px] uppercase">
              +{project.tags.length - 2}
            </span>
          ) : null}
        </div>
        <div className="space-y-3">
          <h3 className="text-2xl font-semibold tracking-tight text-[var(--md-on-surface)]">
            {project.title}
          </h3>
          <p className="text-sm leading-relaxed text-muted md:text-base">
            {project.description}
          </p>
        </div>

        <div className="mt-auto space-y-4">
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span key={tag} className="chip">
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
                  className="btn btn-text text-sm"
                >
                  <span>{link.label}</span>
                  <span className="text-lg" aria-hidden="true">
                    →
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
