"use client"

import type { ReactNode } from "react"
import { Header } from "./header"
import { Sidebar } from "./sidebar"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header onMenuClick={() => {}} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:pr-80">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
