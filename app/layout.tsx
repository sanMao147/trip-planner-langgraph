import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "智能旅行助手 | AI 驱动的个性化旅行规划",
  description:
    "基于 AI 的智能旅行规划助手，集成高德 MCP 地图服务，使用 LangChain + LangGraph 多智能体编排，为您生成包含景点、餐饮、住宿、天气和预算的详细多日旅行计划。",
  keywords: ["旅行规划", "AI旅行", "LangGraph", "MCP", "智能旅行", "行程规划"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={cn("font-sans dark", inter.variable)}>
      <body className="min-h-screen bg-[#0A1628] text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
