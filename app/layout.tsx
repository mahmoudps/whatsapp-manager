import type React from "react"
import type { Metadata } from "next"
import { Tajawal } from "next/font/google"
import ClientLayout from "./client-layout"

export const metadata: Metadata = {
  title: "WhatsApp Manager",
  description: "Professional WhatsApp Management System",
  generator: "Next.js",
  keywords: ["WhatsApp", "Manager", "Business", "Communication"],
  authors: [{ name: "WhatsApp Manager Team" }],
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
}

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  display: "swap",
  weight: ["400", "500", "700"],
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={tajawal.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
