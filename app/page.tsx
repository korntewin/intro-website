"use client";

import Link from "next/link";
import { Carousel } from "@/components/Carousel";
import { data } from "@/lib/data";

export default function Home() {
  return (
    <div className="space-y-14">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <article className="card relative overflow-hidden p-8 md:p-12">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[rgba(76,110,245,0.18)] to-transparent" />
          <div className="relative z-10 flex flex-col gap-8">
            <div className="space-y-4">
              <span className="eyebrow">
                Rust-first · ML Platforms · Graph RAG
              </span>
              <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
                Hi, I’m Korn — crafting
                <span className="block bg-gradient-to-r from-[var(--md-primary)] via-[#00c6ff] to-[var(--md-tertiary)] bg-clip-text text-transparent">
                  adaptive ML systems with Rust velocity
                </span>
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-muted">
                I design end-to-end data and LLM platforms—from low-latency Rust
                services to production-grade Graph RAG workflows. Explore
                selected builds, learn about my journey, and see how I ship
                resilient systems with delightful DX.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link className="btn" href="/projects">
                View Projects
              </Link>
              <Link className="btn btn-tonal" href="/career">
                Career Timeline
              </Link>
              <Link className="btn btn-text" href="/about">
                About
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[var(--shape-lg)] border border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] px-5 py-4 text-sm text-muted">
                <div className="text-[10px] font-semibold uppercase tracking-[0.4em]">
                  Currently
                </div>
                <div className="mt-2 text-base font-semibold text-[var(--md-on-surface)]">
                  Shipping Graph RAG tooling @ Zilo
                </div>
              </div>
              <div className="rounded-[var(--shape-lg)] border border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] px-5 py-4 text-sm text-muted">
                <div className="text-[10px] font-semibold uppercase tracking-[0.4em]">
                  Stack Focus
                </div>
                <div className="mt-2 text-base font-semibold text-[var(--md-on-surface)]">
                  Rust · LangGraph · Databricks · Neo4j
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {data.tags.map((tag) => (
                <span key={tag} className="chip">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </article>

        <div className="flex flex-col gap-4">
          <div className="card flex flex-col gap-6 p-6">
            <div>
              <div className="eyebrow">Currently</div>
              <p className="mt-2 text-lg font-semibold text-[var(--md-on-surface)]">
                Shipping Graph RAG tooling @ Zilo
              </p>
            </div>
            <div>
              <div className="eyebrow">Stack Focus</div>
              <p className="mt-2 text-sm text-muted">
                Rust · LangGraph · Databricks · Neo4j
              </p>
            </div>
          </div>
          <div className="card p-6">
            <div className="eyebrow">Quick Links</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {data.quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  className="chip chip-elevated"
                  rel="noreferrer noopener"
                >
                  {link.label}
                  <span aria-hidden="true">↗</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="card p-6 surface-tonal border border-[var(--md-outline-variant)]">
            <div className="eyebrow">Material 3</div>
            <p className="mt-2 text-sm text-[var(--md-on-secondary-container)]">
              Expressive principles guiding this portfolio refresh.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                "Color",
                "Typography",
                "Shape",
                "Elevation",
                "Motion",
                "Layout",
              ].map((item) => (
                <span key={item} className="chip chip-elevated">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="card flex flex-col overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[var(--md-outline-variant)] px-6 py-6 text-muted md:flex-row md:items-center md:justify-between">
          <div>
            <div className="eyebrow">Spotlight</div>
            <h2 className="text-2xl font-semibold text-[var(--md-on-surface)]">
              Handpicked Builds
            </h2>
          </div>
          <p className="text-sm text-muted">
            Adaptive ML workflows, Rust velocity, and Graph-native
            architectures.
          </p>
        </div>
        <div className="p-4 md:p-6">
          <Carousel items={data.highlights} intervalMs={4000} />
        </div>
      </section>
    </div>
  );
}
