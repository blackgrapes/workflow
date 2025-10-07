import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "./LayoutWrapper";


export const metadata: Metadata = {
  title: "Workflow Management System",
  description: "Centralized workflow management dashboard",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col h-screen`}>
        {/* Client-side wrapper handles Navbar/Sidebar/Footer conditionally */}
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
