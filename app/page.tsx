"use client";

import Link from "next/link";
import { Carousel } from "@/components/Carousel";
import { data } from "@/lib/data";

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="space-y-8">
        <div className="card relative overflow-hidden p-10">
          <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-sky-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-slate-600/20 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/35 via-white/10 to-transparent dark:from-white/10 dark:via-white/5" />
          <div className="relative z-10 flex flex-col gap-10">
            <div className="space-y-5">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/30 px-4 py-1 text-[11px] uppercase tracking-[0.32em] text-muted">
                Rust-first · ML Platforms · Graph RAG
              </span>
              <h1 className="max-w-2xl text-4xl font-semibold leading-tight md:text-6xl">
                Hi, I’m Korn — crafting
                <span className="block bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
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
              <Link className="btn" href="/career">
                Career Timeline
              </Link>
              <Link className="btn" href="/about">
                About
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/30 bg-white/45 px-5 py-4 text-sm text-muted backdrop-blur dark:border-white/10 dark:bg-white/5">
                <div className="text-[10px] uppercase tracking-[0.4em] text-muted">
                  Currently
                </div>
                <div className="mt-2 text-base font-medium text-slate-900 dark:text-slate-100">
                  Shipping Graph RAG tooling @ Zilo
                </div>
              </div>
              <div className="rounded-2xl border border-white/30 bg-white/45 px-5 py-4 text-sm text-muted backdrop-blur dark:border-white/10 dark:bg-white/5">
                <div className="text-[10px] uppercase tracking-[0.4em] text-muted">
                  Stack Focus
                </div>
                <div className="mt-2 text-base font-medium text-slate-900 dark:text-slate-100">
                  Rust · LangGraph · Databricks · Neo4j
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {data.tags.map((tag) => (
                <span key={tag} className="badge">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="card flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/30 px-8 py-6 text-[11px] uppercase tracking-[0.35em] text-muted dark:border-white/10">
            <span>Spotlight</span>
            <span>03 Handpicked Builds</span>
          </div>
          <div className="p-4 md:p-6">
            <Carousel items={data.highlights} intervalMs={4000} />
          </div>
        </div>
      </section>
    </div>
  );
}
