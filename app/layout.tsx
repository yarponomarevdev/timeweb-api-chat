import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Timeweb Manager",
  description: "Управление серверами Timeweb Cloud через AI-чат",
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
