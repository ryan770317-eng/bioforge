import type { Metadata, Viewport } from "next";
import { Noto_Sans_TC } from "next/font/google";
import "./globals.css";
import SwRegister from "@/components/SwRegister";

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "BioHACKING",
  description: "智慧健康管理，從飲食開始",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BioHACKING",
  },
};

export const viewport: Viewport = {
  themeColor: "#e9f955",
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
      <body className="min-h-full bg-[#ebebeb]">
        <SwRegister />
        <div className="md:ml-[200px]">
          {children}
        </div>
      </body>
    </html>
  );
}
