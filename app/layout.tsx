import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "多米罗盘 | A股公开行情学习看板",
  description: "公开盘面学习看板，展示指数、板块与个股资金观察数据。仅供学习，不构成投资建议。",
  applicationName: "多米罗盘",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#03070f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
