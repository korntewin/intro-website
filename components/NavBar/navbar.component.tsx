"use client";

import styles from "./navbar.module.css";
import Link from "next/link";

export default function Navbar() {
    return (
        <nav className={styles.navbar}>
            <div className={styles.navContainer}>
                <ul className={styles.navLinks}>
                    <li className={styles.navItem}>
                        <Link href="/" className={styles.navLink}>Home</Link>
                    </li>
                    <li className={styles.navItem}>
                        <Link href="/about" className={styles.navLink}>About</Link>
                    </li>
                    <li className={styles.navItem}>
                        <Link href="/projects" className={styles.navLink}>Projects</Link>
                    </li>
                </ul>
            </div>
        </nav>
    );
}