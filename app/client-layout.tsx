"use client"

import type React from "react"
import { Tajawal } from "next/font/google"
import { AppProvider } from "@/lib/app-context"
import "./globals.css"

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  display: "swap",
  weight: ["400", "500", "700"],
})


export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={tajawal.className}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}
