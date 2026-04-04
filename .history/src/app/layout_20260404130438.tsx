import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { QueryProvider } from "@/lib/providers/QueryProvider";

import "./globals.css";

const font = Space_Grotesk({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LearnHub - Premium Learning Platform",
  description: "Master modern skills with tiered premium courses and media."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={font.className}>
        <QueryProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-64px)]">{children}</main>
          <Footer />
        </QueryProvider>
      </body>
    </html>
  );
}
