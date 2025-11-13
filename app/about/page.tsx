import { data } from "@/lib/data";
import Link from "next/link";

export default function About() {
  return (
    <div className="space-y-10">
      <section className="card relative overflow-hidden p-8 md:p-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[rgba(76,110,245,0.2)] to-transparent" />
        <div className="relative space-y-3">
          <span className="eyebrow">About</span>
          <h1 className="text-3xl font-semibold md:text-5xl">About Korn</h1>
          <p className="max-w-2xl text-muted">
            ML & software engineer crafting ergonomic developer experiences,
            resilient ML pipelines, and high-performance Rust services. Material
            surfaces keep the story structured and legible.
          </p>
        </div>
      </section>

      <section className="card p-8 text-[var(--md-on-surface)]">
        <article className="prose max-w-none text-[var(--md-on-surface)]">
          <p>
            I’m a software engineer focused on ML/LLMs and high-performance
            backend systems. I enjoy Rust, Python, and TypeScript, and love
            turning research ideas into reliable products with delightful
            developer experience.
          </p>
          <h2>Expertise</h2>
          <ul>
            {data.expertise.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h2>Certifications</h2>
          <ul>
            {data.certifications.map((cert) => (
              <li key={cert.cert}>
                <Link
                  href={cert.href}
                  target="_blank"
                  className="text-[var(--md-primary)]"
                >
                  {cert.cert}
                </Link>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
