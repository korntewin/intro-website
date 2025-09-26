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
    <div className="group relative isolate overflow-hidden rounded-[28px]">
      <div className="relative h-full min-h-[340px]">
        <div className="absolute inset-0">
          {current.image ? (
            <Image
              src={current.image}
              alt={current.title}
              fill
              sizes="(min-width: 1280px) 520px, (min-width: 768px) 420px, 100vw"
              className="absolute inset-0 h-full w-full object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-700 to-slate-900" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_30%,rgba(14,165,233,0.45),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(37,99,235,0.32),transparent_55%)]" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/15 via-slate-950/35 to-slate-950/85" />
          <div className="pointer-events-none absolute -top-32 right-0 h-72 w-72 rounded-full bg-sky-400/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-0 h-72 w-72 rounded-full bg-emerald-400/25 blur-3xl" />
        </div>

        <div className="relative z-10 flex h-full flex-col justify-between gap-8 p-8 text-slate-100">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.4em] text-slate-200/70">
              <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.8)]" />
              Highlighted Build
            </div>
            <h3 className="text-3xl font-semibold leading-tight drop-shadow-lg md:text-4xl">
              {current.title}
            </h3>
            <p className="max-w-xl text-sm leading-relaxed text-slate-200/85 md:text-base">
              {current.description}
            </p>
          </div>

          <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-200/70">
            <span className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-sky-400" />
              Tap To Explore
            </span>
            <div className="flex items-center gap-1">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`slide ${i + 1}`}
                  onClick={() => handleSelect(i)}
                  className={`h-2.5 w-8 rounded-full transition ${
                    i === idx
                      ? "bg-white shadow-[0_0_18px_rgba(255,255,255,0.55)]"
                      : "bg-white/30 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
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
