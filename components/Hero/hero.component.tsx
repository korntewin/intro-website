"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./hero.module.css";

export default function Hero() {
  return (
    <section className={styles.hero} id="whoami">
      <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>Korntewin Boonchuay</h1>
        <h2 className={styles.heroSubtitle}>
          Software Engineer in LLMs and ML
        </h2>
        <p className={styles.heroTagline}>
          Passinate developer with a focus on LLMs and machine learning. I love
          to build things that make a difference.
        </p>
        <div className={styles.heroButtons}>
          <Link href="#contact" className={styles.primaryButton}>
            Contact Me
          </Link>
          <Link href="#projects" className={styles.secondaryButton}>
            View Projects
          </Link>
        </div>
      </div>
      <div className={styles.heroImageContainer}>
        <div className={styles.heroImageWrapper}>
          <Image
            src="/globe.svg"
            alt="Profile"
            className={styles.heroImage}
            width={300}
            height={300}
          />
        </div>
      </div>
    </section>
  );
}
