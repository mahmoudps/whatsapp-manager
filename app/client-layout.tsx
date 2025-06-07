"use client"

import type React from "react"
import { Inter } from "next/font/google"
import { AppProvider } from "@/lib/app-context"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={inter.className}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}
