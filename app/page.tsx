import styles from "./page.module.css";
import ShowCasesV2 from "@/components/ShowCasesV2/showcasesv2.component";
import { AppConfig } from "@/config/app-config";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className={styles.container}>
      <main className={styles.main}>

        {/* Projects Section */}
        <section className={styles.section} id="projects">
          <h2 className={styles.sectionTitle}>Featured Projects</h2>
          <ShowCasesV2 highlights={AppConfig.highlightedProjects} />
        </section>

        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>John Doe</h1>
            <h2 className={styles.subtitle}>Data Engineer | ML Specialist</h2>
            <p className={styles.tagline}>
              Transforming data into actionable insights and innovative solutions
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
              {/* Replace with your profile image if available */}
              <Image 
                src="/globe.svg" 
                alt="Profile" 
                width={300} 
                height={300} 
                className={styles.heroImage} 
              />
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className={styles.section} id="about">
          <h2 className={styles.sectionTitle}>About Me</h2>
          <div className={styles.aboutContent}>
            <p className={styles.description}>
              I'm a passionate Softare Engineer specializing in LLMs and Machine Learning applications.
              With a strong foundation in software engineering principles and cloud technologies, 
              I specialize in turning complex data challenges into elegant, scalable solutions.
            </p>
            
            <div className={styles.highlights}>
              <div className={styles.highlight}>
                <h3>5+</h3>
                <p>Years of Experience</p>
              </div>
              {/* <div className={styles.highlight}>
                <h3>20+</h3>
                <p>Projects Completed</p>
              </div>
              <div className={styles.highlight}>
                <h3>10+</h3>
                <p>Technologies Mastered</p>
              </div> */}
            </div>
          </div>
        </section>

        {/* Skills Section */}
        <section className={styles.section} id="skills">
          <h2 className={styles.sectionTitle}>Skills & Expertise</h2>
          <div className={styles.skillsContainer}>
            <div className={styles.skillCategory}>
              <h3>Data Engineering</h3>
              <div className={styles.skillTags}>
                <span className={styles.skillTag}>Apache Spark</span>
                <span className={styles.skillTag}>SQL</span>
                <span className={styles.skillTag}>Hadoop</span>
                <span className={styles.skillTag}>ETL Pipelines</span>
                <span className={styles.skillTag}>Data Warehousing</span>
              </div>
            </div>
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
              <h3>Programming</h3>
              <div className={styles.skillTags}>
                <span className={styles.skillTag}>Python</span>
                <span className={styles.skillTag}>Java</span>
                <span className={styles.skillTag}>Scala</span>
                <span className={styles.skillTag}>JavaScript/TypeScript</span>
              </div>
            </div>
            <div className={styles.skillCategory}>
              <h3>Cloud Platforms</h3>
              <div className={styles.skillTags}>
                <span className={styles.skillTag}>AWS</span>
                <span className={styles.skillTag}>Azure</span>
                <span className={styles.skillTag}>Google Cloud</span>
                <span className={styles.skillTag}>Kubernetes</span>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className={styles.section} id="contact">
          <h2 className={styles.sectionTitle}>Get In Touch</h2>
          <div className={styles.contactContainer}>
            <div className={styles.contactInfo}>
              <div className={styles.contactItem}>
                <svg className={styles.contactIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p>john.doe@example.com</p>
              </div>
              <div className={styles.contactItem}>
                <svg className={styles.contactIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 16.42V19.956C21.0001 20.2092 20.9042 20.453 20.7316 20.6382C20.559 20.8234 20.3226 20.9363 20.07 20.954C19.633 20.984 19.276 21 19 21C10.163 21 3 13.837 3 5C3 4.724 3.015 4.367 3.046 3.93C3.06372 3.67744 3.17658 3.44101 3.3618 3.26841C3.54703 3.09581 3.79082 2.99989 4.044 3H7.58C7.70404 2.99987 7.8237 3.04586 7.91573 3.12902C8.00776 3.21218 8.0656 3.32658 8.078 3.45C8.101 3.68 8.122 3.863 8.142 4.002C8.34073 5.38892 8.748 6.73783 9.35 8.003C9.445 8.203 9.383 8.442 9.203 8.57L7.045 10.112C8.36445 13.1865 10.8145 15.6365 13.889 16.956L15.429 14.802C15.4919 14.714 15.5838 14.6509 15.6885 14.6237C15.7932 14.5964 15.9042 14.6068 16.002 14.653C17.267 15.2539 18.6156 15.6601 20.002 15.858C20.141 15.878 20.324 15.9 20.552 15.922C20.6752 15.9346 20.7894 15.9926 20.8724 16.0846C20.9553 16.1766 21.0012 16.2961 21.001 16.42H21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p>+1 (555) 123-4567</p>
              </div>
              <div className={styles.contactItem}>
                <svg className={styles.contactIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C11.337 11.5 10.7011 11.2366 10.2322 10.7678C9.76339 10.2989 9.5 9.66304 9.5 9C9.5 8.33696 9.76339 7.70107 10.2322 7.23223C10.7011 6.76339 11.337 6.5 12 6.5C12.663 6.5 13.2989 6.76339 13.7678 7.23223C14.2366 7.70107 14.5 8.33696 14.5 9C14.5 9.66304 14.2366 10.2989 13.7678 10.7678C13.2989 11.2366 12.663 11.5 12 11.5Z" fill="currentColor"/>
                </svg>
                <p>San Francisco, CA</p>
              </div>
            </div>
            
            <div className={styles.socialLinks}>
              <a href="https://github.com/your-username" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.475 2 2 6.475 2 12C1.99887 14.0993 2.65882 16.1456 3.88622 17.8487C5.11362 19.5517 6.84615 20.8251 8.84 21.488C9.34 21.575 9.525 21.275 9.525 21.012C9.525 20.775 9.512 19.988 9.512 19.15C7 19.613 6.35 18.538 6.15 17.975C6.037 17.687 5.55 16.8 5.125 16.562C4.775 16.375 4.275 15.912 5.112 15.9C5.9 15.887 6.462 16.625 6.65 16.925C7.55 18.437 8.988 18.012 9.562 17.75C9.65 17.1 9.912 16.663 10.2 16.413C7.975 16.163 5.65 15.3 5.65 11.475C5.65 10.387 6.037 9.488 6.675 8.787C6.575 8.537 6.225 7.512 6.775 6.137C6.775 6.137 7.612 5.875 9.525 7.163C10.3391 6.93706 11.1802 6.82334 12.025 6.825C12.875 6.825 13.725 6.937 14.525 7.162C16.437 5.862 17.275 6.138 17.275 6.138C17.825 7.513 17.475 8.538 17.375 8.788C18.012 9.488 18.4 10.375 18.4 11.475C18.4 15.313 16.063 16.163 13.838 16.413C14.2 16.725 14.513 17.325 14.513 18.263C14.513 19.6 14.5 20.675 14.5 21.013C14.5 21.275 14.688 21.587 15.188 21.487C17.173 20.8168 18.8979 19.541 20.1199 17.8392C21.3419 16.1373 21.9994 14.094 22 12C22 6.475 17.525 2 12 2Z" fill="currentColor"/>
                </svg>
              </a>
              <a href="https://linkedin.com/in/your-profile" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 8C17.5913 8 19.1174 8.63214 20.2426 9.75736C21.3679 10.8826 22 12.4087 22 14V21H18V14C18 13.4696 17.7893 12.9609 17.4142 12.5858C17.0391 12.2107 16.5304 12 16 12C15.4696 12 14.9609 12.2107 14.5858 12.5858C14.2107 12.9609 14 13.4696 14 14V21H10V14C10 12.4087 10.6321 10.8826 11.7574 9.75736C12.8826 8.63214 14.4087 8 16 8Z" fill="currentColor"/>
                  <path d="M6 9H2V21H6V9Z" fill="currentColor"/>
                  <path d="M4 6C5.10457 6 6 5.10457 6 4C6 2.89543 5.10457 2 4 2C2.89543 2 2 2.89543 2 4C2 5.10457 2.89543 6 4 6Z" fill="currentColor"/>
                </svg>
              </a>
              <a href="https://twitter.com/your-handle" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 4.01C21.9988 3.80242 21.9344 3.60048 21.8145 3.42903C21.6946 3.25758 21.5242 3.12348 21.325 3.05C21.175 3 20.925 3 20.525 3H18C17.334 3 16.694 2.736 16.213 2.267C15.731 1.798 15.455 1.164 15.45 0.5C15.45 0.367392 15.3946 0.240215 15.2964 0.146447C15.1982 0.0526784 15.0679 0 14.931 0L13.622 0.013C13.172 0.025 12.727 0.121 12.308 0.295L11.362 0.652C10.2805 1.1301 9.36528 1.91678 8.72417 2.92028C8.08305 3.92377 7.74347 5.09766 7.75 6.295V7C7.672 7 7.522 7 7.359 7C5.87925 6.99999 4.44041 6.47669 3.254 5.51L1.854 4.363C1.76384 4.28911 1.65058 4.25201 1.53463 4.26124C1.41867 4.27048 1.31284 4.32535 1.237 4.413L1.053 4.624C0.969 4.721 0.939 4.851 0.972 4.973C1.69 8.372 3.873 10.802 7.072 11.917C5.568 13.437 3.168 14.64 0.535 14.816C0.339 14.831 0.175 14.972 0.124 15.164C0.073 15.356 0.146 15.556 0.303 15.674C3.396 17.793 7.047 19 10.883 19C16.729 19 20.615 15.454 21.898 12.957C23.227 10.376 23.953 7.211 23.953 5V4.777C23.9534 4.52721 24.0436 4.28906 24.207 4.107L24.5 3.778C24.5776 3.69441 24.6248 3.58488 24.6346 3.46848C24.6444 3.35207 24.6162 3.23565 24.554 3.138C24.4917 3.04035 24.3989 2.96525 24.2895 2.92453C24.1802 2.88382 24.0601 2.87968 23.948 2.913L23.254 3.124C22.935 3.221 22.705 3.611 22.705 4.01H22Z" fill="currentColor"/>
                </svg>
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
