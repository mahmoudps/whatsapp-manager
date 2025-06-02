"use client"

import type React from "react"
import "./globals.css"
import { ErrorHandler } from "@/lib/error-handler"
import { AppProvider } from "@/lib/app-context"
import { AuthProvider } from "@/lib/use-auth"
import { useEffect } from "react"

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  useEffect(() => {
    ErrorHandler.setupGlobalHandlers()
  }, [])

  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppProvider>
            {children}
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
