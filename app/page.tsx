"use client";

import styles from "./page.module.css";
import ShowCasesV2 from "@/components/ShowCasesV2/showcasesv2.component";
import Hero from "@/components/Hero/hero.component";
import About from "@/components/About/about.component";
import Skills from "@/components/Skills/skills.component";
import Contact from "@/components/Contact/contact.component";
import { AppConfig } from "@/config/app-config";

export default function Home() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>

        <section className={styles.section} id="projects">
          <h2 className={styles.sectionTitle}>Featured Projects</h2>
          <ShowCasesV2 highlights={AppConfig.highlightedProjects} />
        </section>

        <Hero />
        <About />
        <Skills />
        <Contact />
      </main>
    </div>
  );
}
