import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import NotesBackground from "@/components/NotesBackground";
import GlowCursor from "@/components/GlowCursor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Count Coach",
  description: "Dance-mix timing trainer",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#f7f7f8]`}>
        <NotesBackground count={22} />
        <GlowCursor />

        {/* foreground content */}
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
