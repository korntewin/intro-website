"use client";

import styles from "./about.module.css";

export default function About() {
  return (
    <section className={styles.section} id="about">
      <h2 className={styles.sectionTitle}>About Me</h2>
      <div className={styles.aboutContent}>
        <p className={styles.description}>
          I'm a Softare Engineer specializing in LLMs and Machine
          Learning applications with a passion on Rust & Python! 
          With a strong foundation in software
          engineering principles and cloud technologies, I specialize in turning
          complex data challenges into elegant, scalable solutions.
        </p>

        <div className={styles.highlights}>
          <div className={styles.highlight}>
            <h3>4+</h3>
            <p>Years of Experience</p>
          </div>
          <div className={styles.highlight}>
            <h3>5</h3>
            <p>Cloud Certificates</p>
          </div>
          <div className={styles.highlight}>
            <h3>3</h3>
            <p>Programming Languages</p>
          </div>
        </div>
      </div>
    </section>
  );
}
