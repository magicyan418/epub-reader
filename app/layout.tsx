import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yan EPUB",
  description: "Yan 的私密、本地 EPUB 阅读器。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
