import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

import { api } from "@/lib/api";

export async function generateMetadata(): Promise<Metadata> {
  let instName = "D T M N";
  try {
    const item = await api.content.get("institution_name");
    if (item?.value && !item.value.startsWith("[")) {
      instName = item.value;
    }
  } catch {}

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${instName} | Bettadapura`,
      template: `%s | ${instName}`,
    },
    description: `${instName} offers quality education from Nursery through College in Bettadapura. Admissions open for the current academic session.`,
    keywords: [
      instName,
      "D T M N",
      "school",
      "college",
      "admissions",
      "Bettadapura",
      "education",
    ],
    openGraph: {
      type: "website",
      siteName: instName,
      title: instName,
      description: "Quality education from Nursery through College.",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex flex-col min-h-screen">
        {/* Skip navigation link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 btn-primary text-sm"
        >
          Skip to main content
        </a>

        <Navbar />

        <main id="main-content" className="flex-1">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}
