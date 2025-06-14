"use client"

import { useAppContext } from "@/lib/app-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"

export function Notifications() {
  const {
    notifications,
    actions: { removeNotification },
  } = useAppContext()

  if (notifications.length === 0) {
    return null
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4" />
      case "error":
        return <AlertCircle className="h-4 w-4" />
      case "warning":
        return <AlertTriangle className="h-4 w-4" />
      case "info":
        return <Info className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getVariant = (type: string) => {
    switch (type) {
      case "error":
        return "destructive"
      default:
        return "default"
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <Alert key={notification.id} variant={getVariant(notification.type)} className="relative">
          <div className="flex items-start space-x-2">
            {getIcon(notification.type)}
            <div className="flex-1">
              <AlertTitle>{notification.title}</AlertTitle>
              <AlertDescription>{notification.message}</AlertDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => removeNotification(notification.id)}
              aria-label="إغلاق الإشعار"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  )
}
