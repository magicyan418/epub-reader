import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EPUB阅读器",
  description: "简洁、私密的本地 EPUB 阅读器。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
