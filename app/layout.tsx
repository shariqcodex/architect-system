import type { Metadata, Viewport } from "next";
import { Inter, Rajdhani, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppFrame } from "@/components/layout/AppFrame";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-rajdhani",
  display: "swap",
});
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "THE SYSTEM — Hunter Protocol",
  description: "A Solo Leveling–style fitness RPG. Level up your real body.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "THE SYSTEM" },
};

export const viewport: Viewport = {
  themeColor: "#06080D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${rajdhani.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
