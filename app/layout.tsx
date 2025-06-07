import type React from "react"
import type { Metadata } from "next"
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <ClientLayout>{children}</ClientLayout>
}
