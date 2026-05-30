import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Collab Todo List",
  description: "A premium real-time collaborative todo list application for small teams.",
};

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isClerkConfigured = !!(publishableKey && publishableKey.startsWith("pk_") && !publishableKey.includes("placeholder"));

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-50">
        <Providers>
          {!isClerkConfigured && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 text-amber-400 text-center text-sm font-medium flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Mode Demo: Konfigurasi Clerk belum diset di <code>frontend/.env.local</code>. Fitur login & organisasi dinonaktifkan sementara.
            </div>
          )}
          {children}
        </Providers>
      </body>
    </html>
  );

  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      {content}
    </ClerkProvider>
  );
}


