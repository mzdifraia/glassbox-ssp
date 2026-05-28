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
    "Decide when chat may be monetised, block unsafe ads before scoring, and ship transparency receipts judges can audit.",
  openGraph: {
    title: "GlassBox SSP",
    description:
      "Trust before revenue — policy gates, live auction, transparency receipts.",
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
