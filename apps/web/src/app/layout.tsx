import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { authEnabled } from "@/lib/auth";
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
  title: "Global Finance — Institutional Dashboard",
  description:
    "Global stock market data, company financials, valuation tools, and portfolio tracking.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const html = (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );

  // ClerkProvider requires valid keys; only mount it once they're configured
  // so the app still renders (unauthenticated, mock-data mode) without one.
  return authEnabled ? <ClerkProvider>{html}</ClerkProvider> : html;
}
