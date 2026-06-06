import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "スポンサーシップ商品管理",
  description: "スポーツチーム向けスポンサーシップ商品管理プロトタイプ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
