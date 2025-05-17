import styles from "./skills.module.css";

export default function Skills() {
  return (
    <section className={styles.section} id="skills">
      <h2 className={styles.sectionTitle}>Skills & Expertise</h2>
      <div className={styles.skillsContainer}>
        <div className={styles.skillCategory}>
          <h3>Machine Learning</h3>
          <div className={styles.skillTags}>
            <span className={styles.skillTag}>PyTorch</span>
            <span className={styles.skillTag}>TensorFlow</span>
            <span className={styles.skillTag}>Scikit-Learn</span>
            <span className={styles.skillTag}>Natural Language Processing</span>
          </div>
        </div>
        <div className={styles.skillCategory}>
          <h3>AI Engineering</h3>
          <div className={styles.skillTags}>
            <span className={styles.skillTag}>Langchain</span>
            <span className={styles.skillTag}>LangGraph</span>
            <span className={styles.skillTag}>RAG</span>
            <span className={styles.skillTag}>Agents</span>
            <span className={styles.skillTag}>Agentic Workflow</span>
          </div>
        </div>
        <div className={styles.skillCategory}>
          <h3>Full Stack</h3>
          <div className={styles.skillTags}>
            <span className={styles.skillTag}>FastAPI</span>
            <span className={styles.skillTag}>Next.js</span>
            <span className={styles.skillTag}>Database Migration</span>
            <span className={styles.skillTag}>Actix Web</span>
            <span className={styles.skillTag}>Zustand</span>
          </div>
        </div>
        <div className={styles.skillCategory}>
          <h3>Data Engineering</h3>
          <div className={styles.skillTags}>
            <span className={styles.skillTag}>Apache Spark</span>
            <span className={styles.skillTag}>SQL/NoSQL</span>
            <span className={styles.skillTag}>Streaming</span>
            <span className={styles.skillTag}>ETL Pipelines</span>
            <span className={styles.skillTag}>Data Warehousing</span>
          </div>
        </div>
        <div className={styles.skillCategory}>
          <h3>Programming</h3>
          <div className={styles.skillTags}>
            <span className={styles.skillTag}>Python</span>
            <span className={styles.skillTag}>Rust</span>
            <span className={styles.skillTag}>TypeScript</span>
            <span className={styles.skillTag}>Scala</span>
          </div>
        </div>
        <div className={styles.skillCategory}>
          <h3>Cloud Platforms</h3>
          <div className={styles.skillTags}>
            <span className={styles.skillTag}>AWS</span>
            <span className={styles.skillTag}>Azure</span>
            <span className={styles.skillTag}>GCP</span>
            <span className={styles.skillTag}>Kubernetes</span>
            <span className={styles.skillTag}>Terraform</span>
          </div>
        </div>
      </div>
    </section>
  );
}
