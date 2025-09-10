
"use client"
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { ExtensionProvider } from "@/components/ExtensionProvider";
import { Toaster } from "@/components/ui/toaster";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

const metadata: Metadata = {
  title: "CC Axiom Trader",
  description: "Dashboard for monitoring axiom.trade data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-gray-900`}>
        <ExtensionProvider>
          <nav className="bg-gray-100 p-4 border-b border-gray-200">
            <div className="container mx-auto flex justify-between items-center">
              <h1 className="text-xl font-bold text-gray-800">Axiom 数据分析</h1>
              <div className="space-x-4">
                <Link href="/" className="text-gray-600 hover:text-blue-600">仪表盘</Link>
                <Link target="_blank" href="/conf" className="text-gray-600 hover:text-blue-600">配置</Link>
                <Link target="_blank" href="/history" className="text-gray-600 hover:text-blue-600">历史</Link>
              </div>
            </div>
          </nav>
          <main className="p-4 container mx-auto">
            {children}
          </main>
          <Toaster />
        </ExtensionProvider>
      </body>
    </html>
  );
}
