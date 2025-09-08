import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Telegram Video Bot",
  description: "Bot automatizado para recopilar y gestionar videos de Telegram eliminando duplicados",
  keywords: ["telegram", "bot", "videos", "duplicados", "automatización"],
  authors: [{ name: "Telegram Video Bot" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          {children}
        </div>
        <Toaster 
          position="top-right" 
          richColors
          closeButton
          duration={4000}
        />
      </body>
    </html>
  );
}