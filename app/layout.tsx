<<<<<<< HEAD
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
=======
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.dev',
>>>>>>> 83e0b5f7cbb5c54a0d6a252d420d7c6ecc85a6da
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
<<<<<<< HEAD
  return <ClientLayout>{children}</ClientLayout>
=======
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
>>>>>>> 83e0b5f7cbb5c54a0d6a252d420d7c6ecc85a6da
}
