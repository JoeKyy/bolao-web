import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SCRIPT_TEMA } from "@/lib/tema";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Bolão da Mega",
  description: "Organize o bolão da Mega-Sena com o seu grupo: jogos, Pix, conferência e rateio.",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#15803d" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1410" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
