import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GlobalTopNav from "@/components/GlobalTopNav";
import ModuleTabs from "@/components/ModuleTabs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Phase 2 (frontend-only): visual guardrail toggle (no auth/storage yet)
const IS_AUTHENTICATED = false;

export const metadata: Metadata = {
  title: "Jarvis Prime",
  description: "Jarvis Prime — Operations Command Center",
};

function AuthBanner() {
  if (IS_AUTHENTICATED) return null;

  return (
    <div className="auth-banner" role="status" aria-live="polite">
      <span className="auth-badge">DEMO</span>
      <span className="auth-text">
        You are viewing Jarvis Prime in logged-out demo mode. Sign in to continue.
      </span>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Level 0: Global Top Bar */}
        <GlobalTopNav />

        {/* Phase 2: Visual auth guardrail (UI-only, no blocking) */}
        <AuthBanner />

        {/* Level 1: Module Tabs */}
        <ModuleTabs />

        {/* Page Content */}
        <main className="page-content">{children}</main>
      </body>
    </html>
  );
}