"use client"
import { useApp } from "@/lib/app-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect } from "react"

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const colorMap = {
  success: "border-green-500 bg-green-50 text-green-800",
  error: "border-red-500 bg-red-50 text-red-800",
  warning: "border-yellow-500 bg-yellow-50 text-yellow-800",
  info: "border-blue-500 bg-blue-50 text-blue-800",
}

export function Notifications() {
  const { state, actions } = useApp()

  // تسجيل الإشعارات في وحدة التحكم للتصحيح
  useEffect(() => {
    if (state.notifications.length > 0) {
      console.log("Current notifications:", state.notifications)
    }
  }, [state.notifications])

  if (state.notifications.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {state.notifications.map((notification) => {
        const Icon = iconMap[notification.type]
        return (
          <Alert key={notification.id} className={cn("relative pr-8", colorMap[notification.type])}>
            <Icon className="h-4 w-4" />
            <AlertTitle>{notification.title}</AlertTitle>
            <AlertDescription>{notification.message}</AlertDescription>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 p-0"
              onClick={() => actions.removeNotification(notification.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Alert>
        )
      })}
    </div>
  )
}

// Export as default as well for compatibility
export default Notifications
