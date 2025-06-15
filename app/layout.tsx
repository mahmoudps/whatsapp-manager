import type React from "react"
import { Tajawal, Inter } from "next/font/google"
import ClientLayout from "./client-layout"
import { cookies } from "next/headers"

export const metadata = {
  title: "WhatsApp Manager",
  description: "Professional WhatsApp Management System",
  generator: "Next.js",
  keywords: ["WhatsApp", "Manager", "Business", "Communication"],
  authors: [{ name: "WhatsApp Manager Team" }],
  icons: [{ rel: "icon", url: "/favicon.svg", type: "image/svg+xml" }],
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

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "ar"
  const dir = locale === "ar" ? "rtl" : "ltr"
  return (
    <html lang={locale} dir={dir}>
      <body className={`${tajawal.className} ${inter.className} metro`}> 
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
