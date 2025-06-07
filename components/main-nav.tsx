"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface MainNavProps {
  className?: string
}

export function MainNav({ className }: MainNavProps) {
  const pathname = usePathname()

  return (
    <div className={cn("flex items-center space-x-4 lg:space-x-6", className)}>
      <Link
        href="/dashboard"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/dashboard" ? "text-black dark:text-white" : "text-muted-foreground",
        )}
      >
        الرئيسية
      </Link>
      <Link
        href="/devices"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/devices" ? "text-black dark:text-white" : "text-muted-foreground",
        )}
      >
        الأجهزة
      </Link>
      <Link
        href="/messages"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/messages" ? "text-black dark:text-white" : "text-muted-foreground",
        )}
      >
        الرسائل
      </Link>
      <Link
        href="/settings"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/settings" ? "text-black dark:text-white" : "text-muted-foreground",
        )}
      >
        الإعدادات
      </Link>
      <Link
        href="/diagnostics"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/diagnostics" ? "text-black dark:text-white" : "text-muted-foreground",
        )}
      >
        التشخيص
      </Link>
    </div>
  )
}
