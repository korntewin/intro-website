import Navbar from "@/components/NavBar/navbar.component";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Korntewin (Korn) | Developer & Designer Portfolio",
  description: "Personal portfolio and introduction website showcasing Korntewin's projects, skills, and professional background",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
