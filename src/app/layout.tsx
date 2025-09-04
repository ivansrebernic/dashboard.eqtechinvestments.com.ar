import type { Metadata } from "next";
import { Geist, Geist_Mono, Montserrat, DM_Serif_Text } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700'],
});

const dmSerif = DM_Serif_Text({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: ['400'],
});

// Using system font fallback for Roboto Flex since it's not in next/font/google
// Can be replaced with actual Roboto Flex once available

export const metadata: Metadata = {
  title: "EQTech Investments - Portfolio Management",
  description: "Professional portfolio management and investment tracking platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} ${dmSerif.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
