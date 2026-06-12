import type { Metadata, Viewport } from "next";
import { Noto_Sans_TC, Noto_Serif_TC, Fraunces } from "next/font/google";
import "./globals.css";
import SwRegister from "@/components/SwRegister";
import BottomNav from "@/components/BottomNav";

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const notoSerifTC = Noto_Serif_TC({
  variable: "--font-noto-serif-tc",
  subsets: ["latin"],
  weight: ["600", "900"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "體態計畫",
  description: "69.8 → 62–64。一天一張照片就好。",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "體態計畫",
  },
};

export const viewport: Viewport = {
  themeColor: "#f5efe3",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-TW"
      className={`${notoSansTC.variable} ${notoSerifTC.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <SwRegister />
        <div className="mx-auto max-w-md px-4 pt-4 pb-28">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
