import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "A&S Studio Project - Creative Studio & Premium Hosting Services",
  description: "Creative studio & premium hosting services untuk kebutuhan digital anda. Game hosting premium, RDP berkualitas, dan jasa development profesional dengan sentuhan artistik yang unik.",
  keywords: ["A&S Studio", "Game Hosting", "RDP Premium", "Development Services", "FiveM", "Roblox", "Creative Studio", "Premium Hosting"],
  authors: [{ name: "A&S Studio Project" }],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "A&S Studio Project - Creative Studio & Premium Hosting Services",
    description: "Solusi kreatif untuk kebutuhan digital anda. Game hosting premium, RDP berkualitas, dan jasa development profesional.",
    url: "https://as-studio-project.com",
    siteName: "A&S Studio Project",
    type: "website",
    images: [
      {
        url: "/logo-as-studio.png",
        width: 1200,
        height: 630,
        alt: "A&S Studio Project Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "A&S Studio Project - Creative Studio & Premium Hosting Services",
    description: "Solusi kreatif untuk kebutuhan digital anda. Game hosting premium, RDP berkualitas, dan jasa development profesional.",
    images: ["/logo-as-studio.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
