import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import "./globals.css";

const sansFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const headingFont = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "SariSmart — Intelligent Sari-Sari Inventory & Retail OS",
  description: "Next-generation inventory management, real-time margin telemetry, and wholesale PDF printing for Philippine sari-sari stores.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#1a7949",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full antialiased ${sansFont.variable} ${headingFont.variable}`}>
      <body className="min-h-full flex flex-col font-sans selection:bg-[#b7dec2] selection:text-[#0f472b]">
        {children}
      </body>
    </html>
  );
}
