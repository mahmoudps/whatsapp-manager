"use client"

import { cn } from "@/lib/utils"

interface StatusIndicatorProps {
  status: "online" | "offline" | "connecting" | "error"
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  className?: string
}

export function StatusIndicator({ status, size = "md", showLabel = false, className }: StatusIndicatorProps) {
  const statusConfig = {
    online: {
      color: "bg-green-500",
      label: "متصل",
      animation: "",
    },
    offline: {
      color: "bg-gray-500",
      label: "غير متصل",
      animation: "",
    },
    connecting: {
      color: "bg-blue-500",
      label: "يتصل...",
      animation: "animate-pulse",
    },
    error: {
      color: "bg-red-500",
      label: "خطأ",
      animation: "animate-pulse",
    },
  }

  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  }

  const config = statusConfig[status]

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("rounded-full", config.color, config.animation, sizeClasses[size])} />
      {showLabel && <span className="text-sm text-muted-foreground">{config.label}</span>}
    </div>
  )
}
