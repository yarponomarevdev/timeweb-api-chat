import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "evolvin.cloud",
  description: "Управление серверами через AI-чат evolvin.cloud",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="dark">
      <body suppressHydrationWarning className={`${geist.variable} font-sans antialiased bg-[#212121] text-[#ececec] h-screen w-screen overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}
