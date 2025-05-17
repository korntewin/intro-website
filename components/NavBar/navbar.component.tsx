"use client";

import styles from "./navbar.module.css";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    return (
        <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ""}`}>
            <div className={styles.navContainer}>
                <Link href="/" className={styles.logo}>
                    <span>John Doe</span>
                </Link>

                <button className={styles.mobileMenuButton} onClick={toggleMobileMenu} aria-label="Toggle navigation menu">
                    <div className={`${styles.hamburger} ${mobileMenuOpen ? styles.active : ""}`}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </button>

                <ul className={`${styles.navLinks} ${mobileMenuOpen ? styles.mobileActive : ""}`}>
                    <li className={styles.navItem}>
                        <Link href="/" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>Home</Link>
                    </li>
                    <li className={styles.navItem}>
                        <Link href="#about" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>About</Link>
                    </li>
                    <li className={styles.navItem}>
                        <Link href="#skills" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>Skills</Link>
                    </li>
                    <li className={styles.navItem}>
                        <Link href="#projects" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>Projects</Link>
                    </li>
                    <li className={styles.navItem}>
                        <Link href="#contact" className={styles.navLink} onClick={() => setMobileMenuOpen(false)}>Contact</Link>
                    </li>
                </ul>
            </div>
        </nav>
    );
}