import type React from "react"
import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import "./globals.css"
import { ScrapingProvider } from "@/lib/context/scraping-context"
import { ErrorBoundary } from "@/components/error-boundary"

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
})

export const metadata: Metadata = {
  title: "数据爬虫平台 - Scraping Platform",
  description: "输入网站URL和Supabase配置，实时爬取招聘职位信息",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className={`${dmSans.variable} antialiased`}>
      <body className="font-sans">
        <ErrorBoundary>
          <ScrapingProvider>{children}</ScrapingProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
