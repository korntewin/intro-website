"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

type CarouselItem = {
  title: string;
  description: string;
  image?: string;
  href?: string;
};

export function Carousel({
  items,
  intervalMs = 4000,
}: {
  items: readonly CarouselItem[];
  intervalMs?: number;
}) {
  const [idx, setIdx] = useState(0);
  const hasItems = items.length > 0;

  const intervalRef = useRef<number | null>(null);
  const prefersReducedMotionRef = useRef(false);

  const stopRotation = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startRotation = useCallback(() => {
    stopRotation();
    intervalRef.current = window.setInterval(() => {
      setIdx((current) => (current + 1) % items.length);
    }, intervalMs);
  }, [intervalMs, items.length, stopRotation]);

  useEffect(() => {
    if (!hasItems) {
      return undefined;
    }

    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    prefersReducedMotionRef.current = motionPreference.matches;

    if (!motionPreference.matches) {
      startRotation();
    }

    const handleMotionChange = (event: MediaQueryListEvent) => {
      prefersReducedMotionRef.current = event.matches;
      if (event.matches) {
        stopRotation();
      } else {
        startRotation();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        stopRotation();
      }

      if (
        document.visibilityState === "visible" &&
        !prefersReducedMotionRef.current
      ) {
        startRotation();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    if (typeof motionPreference.addEventListener === "function") {
      motionPreference.addEventListener("change", handleMotionChange);
    } else if (typeof motionPreference.addListener === "function") {
      motionPreference.addListener(handleMotionChange);
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (typeof motionPreference.removeEventListener === "function") {
        motionPreference.removeEventListener("change", handleMotionChange);
      } else if (typeof motionPreference.removeListener === "function") {
        motionPreference.removeListener(handleMotionChange);
      }
      stopRotation();
    };
  }, [hasItems, startRotation, stopRotation]);

  const handleSelect = useCallback(
    (position: number) => {
      setIdx(position);

      if (prefersReducedMotionRef.current) {
        return;
      }

      startRotation();
    },
    [startRotation],
  );

  if (!hasItems) {
    return null;
  }

  const current = items[idx];

  return (
    <div className="relative isolate overflow-hidden rounded-[var(--shape-xl)] border border-[var(--md-outline-variant)] bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] shadow-2xl">
      <div className="absolute inset-0 opacity-80">
        {current.image ? (
          <Image
            src={current.image}
            alt={current.title}
            fill
            sizes="(min-width: 1280px) 520px, (min-width: 768px) 420px, 100vw"
            className="h-full w-full object-cover mix-blend-luminosity"
            priority
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#0b2250] via-[#0f1c3b] to-[#0a2f38]" />
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[rgba(10,29,83,0.45)] via-transparent to-[rgba(15,69,57,0.55)]" />
      <div className="relative z-10 flex flex-col gap-10 p-8 md:p-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.4em]">
            <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-[var(--md-tertiary)] shadow-[0_0_12px_rgba(45,212,191,0.8)]" />
            Highlighted Build
          </div>
          <span className="text-xs font-semibold">
            {String(idx + 1).padStart(2, "0")}/
            {String(items.length).padStart(2, "0")}
          </span>
        </div>
        <div className="space-y-4">
          <h3 className="text-3xl font-semibold leading-tight md:text-4xl">
            {current.title}
          </h3>
          <p className="max-w-2xl text-base text-white/85">
            {current.description}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/40 bg-white/10 text-[0.6rem]">
              ↗
            </span>
            Tap To Explore
          </div>
          <div className="flex items-center gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`slide ${i + 1}`}
                onClick={() => handleSelect(i)}
                className={`h-2.5 rounded-full transition ${
                  i === idx
                    ? "w-12 bg-white shadow-[0_0_18px_rgba(255,255,255,0.55)]"
                    : "w-6 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      <a
        href={current.href ?? "#"}
        target="_blank"
        rel="noreferrer noopener"
        className="absolute inset-0"
        aria-label={current.title}
      />
    </div>
  );
}
