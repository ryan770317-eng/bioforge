import type { Metadata, Viewport } from "next";
import { Noto_Sans_TC } from "next/font/google";
import "./globals.css";
import SwRegister from "@/components/SwRegister";

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "BioForge",
  description: "智慧健康管理，從飲食開始",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BioForge",
  },
};

export const viewport: Viewport = {
  themeColor: "#D4A24E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className={`${notoSansTC.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#FFF8F0]">
        <SwRegister />
        {/* md+: content shifted right of 200px side nav */}
        <div className="md:ml-[200px]">
          {children}
        </div>
      </body>
    </html>
  );
}
