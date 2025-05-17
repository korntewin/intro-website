import styles from "./page.module.css";
import ShowCasesV2, {ShowCaseV2Data} from "@/components/ShowCasesV2/showcasesv2.component";
import { AppConfig } from "@/config/app-config";

export default function Home() {

  const highlightedProjects: ShowCaseV2Data[] = [
    {
      id: "project-1",
      image: "/project1.svg",
      title: "Portfolio Website",
      summary: "A modern portfolio website built with Next.js and React. Features responsive design, smooth animations, and optimized performance.",
      technologies: ["Next.js", "React", "TypeScript", "CSS Modules"],
      link: "https://github.com/your-username/portfolio-website"
    },
    {
      id: "project-2",
      image: "/project2.svg",
      title: "AI-Powered Task Manager",
      summary: "Smart task management application that uses machine learning to prioritize tasks and suggest optimal work schedules based on user habits.",
      technologies: ["Python", "TensorFlow", "React", "Node.js"],
      link: "https://github.com/your-username/ai-task-manager"
    },
    {
      id: "project-3",
      image: "/project3.svg",
      title: "E-commerce Platform",
      summary: "Full-featured e-commerce solution with product management, user authentication, cart functionality, and payment processing.",
      technologies: ["Vue.js", "Express", "MongoDB", "Stripe API"],
      link: "https://github.com/your-username/ecommerce-platform"
    }
  ];
  
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <ShowCasesV2 highlights={highlightedProjects} />
        <h1 className={styles.title}>Welcome to My Website</h1>
        <p className={styles.description}>
          Explore and learn more about me and my projects
        </p>
      </main>
    </div>
  );
}
