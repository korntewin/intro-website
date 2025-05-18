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
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [slideDirection, setSlideDirection] = useState<"next" | "prev">("next");
  const touchStartXRef = useRef<number | null>(null); // Added for touch handling
  const touchEndXRef = useRef<number | null>(null); // Added for touch handling

  // Auto-rotate with progress tracking using configurable interval
  useEffect(() => {
    if (highlights.length <= 1 || isPaused) return;

    // Reset progress when index changes

    // Animation interval for progress bar
    const progressUpdateInterval = AppConfig.showcases.progressUpdateIntervalMs;
    const progressIntervalRef = setInterval(() => {
      const newProgress =
        progressRef.current +
        (progressUpdateInterval / autoRotateIntervalMs) * 100;
      progressRef.current = newProgress > 100 ? 100 : newProgress;
      progressBarRef.current!.style.width = `${progressRef.current}%`;
    }, progressUpdateInterval);

    // Slide change interval
    const slideInterval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % highlights.length);
      progressRef.current = 0;
    }, autoRotateIntervalMs + 1000);

    return () => {
      clearInterval(slideInterval);
      clearInterval(progressIntervalRef);
    }; // Cleanup on unmount
  }, [highlights.length, currentIndex, isPaused, autoRotateIntervalMs]);

  // Manual navigation functions
  const goToPrevious = useCallback(() => {
    setSlideDirection("prev");
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? highlights.length - 1 : prevIndex - 1
    );
    progressRef.current = 0;
  }, [highlights.length]);

  const goToNext = useCallback(() => {
    setSlideDirection("next");
    setCurrentIndex((prevIndex) => (prevIndex + 1) % highlights.length);
    progressRef.current = 0;
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
    progressRef.current = 0;
    progressBarRef.current!.style.width = `${progressRef.current}%`;
    setIsPaused(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPaused(false);
  }, []);

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    // Pause rotation on touch
    setIsPaused(true);
    progressRef.current = 0;
    if (progressBarRef.current) {
      progressBarRef.current.style.width = `0%`;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndXRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) {
      return;
    }

    const diffX = touchEndXRef.current - touchStartXRef.current;
    const swipeThreshold = 50; // Minimum distance for a swipe

    if (diffX > swipeThreshold) {
      goToPrevious();
    } else if (diffX < -swipeThreshold) {
      goToNext();
    }

    // Reset touch positions
    touchStartXRef.current = null;
    touchEndXRef.current = null;
    // Optionally resume auto-rotation after a delay or keep it paused
    // For now, it will remain paused as per handleTouchStart logic
    // To resume, you might want to set a timeout here to set isPaused(false)
  }, [goToPrevious, goToNext]);

  if (highlights.length === 0) {
    return null; // Don't render if no highlights
  }

  return (
    <div
      ref={containerRef}
      className={styles.showcasesContainer}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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

        {/* NEW: Viewport for slides */}
        <div className={styles.slidesViewport}>
          {highlights.map((highlight, index) => {
            let positionStyle: React.CSSProperties = {};
            if (index === currentIndex) {
              positionStyle = {
                transform: "translateX(0%)",
                opacity: 1,
                zIndex: 1,
              };
            } else if (
              index ===
              (currentIndex - 1 + highlights.length) % highlights.length
            ) {
              // Previous slide
              positionStyle = {
                transform:
                  slideDirection === "next"
                    ? "translateX(-100%)"
                    : "translateX(-100%)",
                opacity: 0,
                zIndex: 0,
              };
            } else if (index === (currentIndex + 1) % highlights.length) {
              // Next slide
              positionStyle = {
                transform:
                  slideDirection === "prev"
                    ? "translateX(100%)"
                    : "translateX(100%)",
                opacity: 0,
                zIndex: 0,
              };
            } else {
              // Other slides (further away)
              // Position them further out to avoid them flashing in during quick transitions
              // or if the transition logic needs them to be 'somewhere'
              positionStyle = {
                transform:
                  index < currentIndex
                    ? "translateX(-200%)"
                    : "translateX(200%)",
                opacity: 0,
                zIndex: 0,
              };
            }

            return (
              <div
                key={highlight.id} // Use a unique ID from your data
                className={`${styles.showcaseContent} ${
                  index === currentIndex ? styles.activeSlide : ""
                }`}
                style={positionStyle}
                aria-hidden={index !== currentIndex}
              >
                <div className={styles.imageContainer}>
                  <Image
                    src={highlight.image} // Use highlight.image
                    alt={highlight.title} // Use highlight.title
                    style={{ objectFit: "contain" }}
                    fill
                    className={styles.showcaseImage}
                    priority={index === 0} // Prioritize the first image
                  />
                </div>

                <div className={styles.textContainer}>
                  <h2 className={styles.showcaseTitle}>{highlight.title}</h2>
                  <p className={styles.showcaseSummary}>{highlight.summary}</p>

                  {highlight.technologies && (
                    <div className={styles.technologies}>
                      {highlight.technologies.map((tech, i) => (
                        <span key={i} className={styles.techBadge}>
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  {highlight.link && (
                    <a
                      href={highlight.link}
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
            );
          })}
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
      {highlights.length > 1 && (
        <div className={styles.progressContainer}>
          <div ref={progressBarRef} className={styles.progressBar} />
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
                // Determine direction for transition if needed, though direct click might not need it
                // For simplicity, we can assume 'next' or check if i > currentIndex
                setSlideDirection(i > currentIndex ? "next" : "prev");
                setCurrentIndex(i);
                progressRef.current = 0;
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
