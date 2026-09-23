import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import GlassBackground from "@/components/GlassBackground";
import TopNav from "@/components/TopNav";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "névoa — blog",
  description: "Um blog com visual liquid glass, publicado direto do GitHub.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>
        <AuthProvider>
          <GlassBackground />
          <div className="page">
            <TopNav />
            {children}
            <footer className="site-footer">
              feito com vidro, névoa e alguns arquivos .json
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
