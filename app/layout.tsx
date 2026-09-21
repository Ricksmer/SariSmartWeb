import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SariSmart",
  description: "Inventory management for sari-sari stores",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#1a7949",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
