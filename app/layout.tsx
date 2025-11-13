import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "../styles/prose.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeToggle";
import { themeHydrationScript } from "@/lib/theme-store";
import { Roboto_Flex } from "next/font/google";

const roboto = Roboto_Flex({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto-flex",
  axes: ["GRAD", "XOPQ", "XTRA", "YOPQ", "YTAS", "YTDE", "YTLC", "YTUC"],
});

export const metadata: Metadata = {
  title: "Korntewin Boonchuay — Portfolio",
  description: "Rust-first ML/Software Engineer — Portfolio & Projects",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${roboto.variable} font-sans`}>
        <script dangerouslySetInnerHTML={{ __html: themeHydrationScript }} />
        <ThemeProvider>
          <Header />
          <main className="container py-10">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
