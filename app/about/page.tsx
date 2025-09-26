import { data } from "@/lib/data";
import Link from "next/link";

export default function About() {
  return (
    <div className="space-y-12">
      <div className="card relative overflow-hidden p-8">
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-slate-600/15 blur-3xl" />
        <div className="relative space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-1 text-[11px] uppercase tracking-[0.35em] text-muted dark:border-white/10">
            About
          </span>
          <h1 className="text-3xl font-semibold md:text-5xl">About Korn</h1>
          <p className="max-w-2xl text-muted">
            ML & software engineer crafting ergonomic developer experiences,
            resilient ML pipelines, and high-performance Rust services.
          </p>
        </div>
      </div>

      <article className="prose max-w-none rounded-[28px] border border-white/25 bg-white/70 p-8 text-slate-900 backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-slate-100">
        <p>
          I’m a software engineer focused on ML/LLMs and high-performance
          backend systems. I enjoy Rust, Python, and TypeScript, and love
          turning research ideas into reliable products.
        </p>
        <h2 className="text-2xl font-semibold dark:text-slate-100">
          Expertise
        </h2>
        <ul>
          {data.expertise.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <h2 className="text-2xl font-semibold dark:text-slate-100">
          Certifications
        </h2>
        <ul>
          {data.certifications.map((cert) => (
            <li key={cert.cert}>
              <Link
                className="dark:text-slate-100"
                href={cert.href}
                target="_blank"
              >
                {cert.cert}
              </Link>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}
