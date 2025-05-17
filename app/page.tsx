import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>Welcome to My Website</h1>
        <p className={styles.description}>
          Explore and learn more about me and my projects
        </p>
      </main>
    </div>
  );
}
