import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GlassBox SSP — Publisher trust layer for AI ads",
  description:
    "Publisher policy pipeline for in-chat ads — safety gates, Tavily claim checks, auction scoring, receipts, traces.",
  openGraph: {
    title: "GlassBox SSP",
    description:
      "Ten-step policy pipeline, stub supply, hybrid claim grounding, Overmind-ready traces.",
    url: "https://glassbox-ssp.vercel.app",
    siteName: "GlassBox SSP",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
