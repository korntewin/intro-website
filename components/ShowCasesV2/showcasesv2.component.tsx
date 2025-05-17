"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import styles from "./showcasesv2.module.css";
import Image from "next/image";

import { AppConfig } from "@/config/app-config";
import { ArrowLeft, ArrowRight, FollowLink } from "./showcasesv2.icon";

export type ShowCaseV2Data = {
  id: string;
  image: string;
  title: string;
  summary: string;
  technologies?: string[];
  link?: string;
};

interface ShowCasesV2Props {
  highlights: ShowCaseV2Data[];
  // Optional prop to override the default auto-rotate interval
  autoRotateIntervalMs?: number;
}

export default function ShowCasesV2({
  highlights,
  autoRotateIntervalMs = AppConfig.showcases.autoRotateIntervalMs,
}: ShowCasesV2Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-rotate with progress tracking using configurable interval
  useEffect(() => {
    if (highlights.length <= 1 || isPaused) return;

    // Reset progress when index changes
    setProgress(0);

    // Animation interval for progress bar
    const progressUpdateInterval = AppConfig.showcases.progressUpdateIntervalMs;
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const newProgress =
          prev + (progressUpdateInterval / autoRotateIntervalMs) * 100;
        return newProgress > 100 ? 100 : newProgress;
      });
    }, progressUpdateInterval);

    // Slide change interval
    const slideInterval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % highlights.length);
    }, autoRotateIntervalMs);

    return () => {
      clearInterval(slideInterval);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }; // Cleanup on unmount
  }, [highlights.length, currentIndex, isPaused, autoRotateIntervalMs]);

  // Manual navigation functions
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? highlights.length - 1 : prevIndex - 1
    );
    setProgress(0); // Reset progress when manually changing slides
  }, [highlights.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % highlights.length);
    setProgress(0); // Reset progress when manually changing slides
  }, [highlights.length]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [goToNext, goToPrevious]);

  // Pause on hover
  const handleMouseEnter = useCallback(() => {
    setIsPaused(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPaused(false);
    setProgress(0); // Reset progress when resuming
  }, []);

  if (highlights.length === 0) {
    return null; // Don't render if no highlights
  }

  const currentHighlight = highlights[currentIndex];

  return (
    <div
      ref={containerRef}
      className={styles.showcasesContainer}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      tabIndex={0} // Make it focusable for keyboard navigation
    >
      {/* Current slide indicator */}
      <div className={styles.slideIndicator}>
        <span>
          {currentIndex + 1}/{highlights.length}
        </span>
        {isPaused && <span className={styles.pausedIndicator}>PAUSED</span>}
      </div>

      <div className={styles.showcaseWrapper}>
        <button
          className={`${styles.navButton} ${styles.prevButton}`}
          onClick={goToPrevious}
          aria-label="Previous project"
        >
          <ArrowLeft />
        </button>

        <div className={styles.showcaseContent}>
          <div className={styles.imageContainer}>
            <Image
              src={currentHighlight.image}
              alt={currentHighlight.title}
              fill
              style={{ objectFit: "contain" }}
              priority
              className={styles.showcaseImage}
            />
          </div>

          <div className={styles.textContainer}>
            <h2 className={styles.showcaseTitle}>{currentHighlight.title}</h2>
            <p className={styles.showcaseSummary}>{currentHighlight.summary}</p>

            {currentHighlight.technologies && (
              <div className={styles.technologies}>
                {currentHighlight.technologies.map((tech, i) => (
                  <span key={i} className={styles.techBadge}>
                    {tech}
                  </span>
                ))}
              </div>
            )}

            {currentHighlight.link && (
              <a
                href={currentHighlight.link}
                className={styles.projectLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Project
                <FollowLink />
              </a>
            )}
          </div>
        </div>

        <button
          className={`${styles.navButton} ${styles.nextButton}`}
          onClick={goToNext}
          aria-label="Next project"
        >
          <ArrowRight />
        </button>
      </div>

      {/* Progress bar */}
      {highlights.length > 1 && !isPaused && (
        <div className={styles.progressContainer}>
          <div
            className={styles.progressBar}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Slide indicators/dots */}
      {highlights.length > 1 && (
        <div className={styles.indicators}>
          {highlights.map((_, i) => (
            <button
              key={i}
              className={`${styles.indicator} ${
                i === currentIndex ? styles.active : ""
              }`}
              onClick={() => {
                setCurrentIndex(i);
                setProgress(0);
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
