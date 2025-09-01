
// cc-axiom-trader/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { ExtensionProvider } from "@/components/ExtensionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CC Axiom Trader",
  description: "Dashboard for monitoring axiom.trade data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-gray-900`}>
        <ExtensionProvider>
          <nav className="bg-gray-100 p-4 border-b border-gray-200">
            <div className="container mx-auto flex justify-between items-center">
              <h1 className="text-xl font-bold text-gray-800">Axiom Trader</h1>
              <div className="space-x-4">
                <Link href="/" className="text-gray-600 hover:text-blue-600">Dashboard</Link>
                <Link href="/conf" className="text-gray-600 hover:text-blue-600">Config</Link>
                <Link href="/history" className="text-gray-600 hover:text-blue-600">History</Link>
              </div>
            </div>
          </nav>
          <main className="p-4 container mx-auto">
            {children}
          </main>
        </ExtensionProvider>
      </body>
    </html>
  );
}
