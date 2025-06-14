"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Smartphone, Wifi, WifiOff, QrCode, MessageSquare, Trash2, AlertTriangle, Loader2, Phone } from "lucide-react"
import type { Device } from "@/lib/types"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface DeviceCardProps {
  device: Device
  onConnect: (deviceId: number) => void
  onDisconnect: (deviceId: number) => void
  onDelete: (deviceId: number) => void
  onSendMessage: (deviceId: number) => void
  isLoading?: boolean
}

export function DeviceCard({
  device,
  onConnect,
  onDisconnect,
  onDelete,
  onSendMessage,
  isLoading = false,
}: DeviceCardProps) {
  const [showQR, setShowQR] = useState(false)
  const [showError, setShowError] = useState(!!device.errorMessage)

  useEffect(() => {
    if (device.errorMessage) {
      setShowError(true)
    } else {
      setShowError(false)
    }
  }, [device.errorMessage])

  useEffect(() => {
    if (device.status === "connected" && showError) {
      const t = setTimeout(() => setShowError(false), 3000)
      return () => clearTimeout(t)
    }
  }, [device.status, showError])

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "connected":
        return {
          label: "متصل",
          variant: "default" as const,
          icon: Wifi,
          color: "text-green-600",
          bgColor: "bg-green-50 border-green-200",
        }
      case "connecting":
        return {
          label: "يتصل",
          variant: "secondary" as const,
          icon: Loader2,
          color: "text-blue-600",
          bgColor: "bg-blue-50 border-blue-200",
        }
      case "qr_ready":
        return {
          label: "QR جاهز",
          variant: "outline" as const,
          icon: QrCode,
          color: "text-orange-600",
          bgColor: "bg-orange-50 border-orange-200",
        }
      case "error":
      case "auth_failed":
        return {
          label: "خطأ",
          variant: "destructive" as const,
          icon: AlertTriangle,
          color: "text-red-600",
          bgColor: "bg-red-50 border-red-200",
        }
      default:
        return {
          label: "غير متصل",
          variant: "outline" as const,
          icon: WifiOff,
          color: "text-gray-600",
          bgColor: "bg-gray-50 border-gray-200",
        }
    }
  }

  const statusConfig = getStatusConfig(device.status)
  const StatusIcon = statusConfig.icon

  const canConnect = device.status === "disconnected" || device.status === "error"
  const canDisconnect = device.status === "connected" || device.status === "connecting"
  const canSendMessage = device.status === "connected"
  const hasQR = device.status === "qr_ready" && device.qrCode

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          "hover:shadow-2xl hover:shadow-blue-500/10",
          "border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800",
          statusConfig.bgColor,
        )}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-gray-900/50 pointer-events-none" />

        {/* Status Indicator */}
        <div className="absolute top-4 left-4">
          <motion.div
            animate={{
              scale: device.status === "connecting" ? [1, 1.2, 1] : 1,
            }}
            transition={{
              duration: 1.5,
              repeat: device.status === "connecting" ? Number.POSITIVE_INFINITY : 0,
            }}
            className={cn(
              "h-3 w-3 rounded-full",
              device.status === "connected" && "bg-green-500 shadow-lg shadow-green-500/50",
              device.status === "connecting" && "bg-blue-500 shadow-lg shadow-blue-500/50",
              device.status === "qr_ready" && "bg-orange-500 shadow-lg shadow-orange-500/50",
              device.status === "error" && "bg-red-500 shadow-lg shadow-red-500/50",
              !["connected", "connecting", "qr_ready", "error"].includes(device.status) && "bg-gray-400",
            )}
          />
        </div>

        <CardHeader className="pb-3 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-gray-600" />
              <CardTitle className="text-lg">{device.name}</CardTitle>
            </div>
            <Badge variant={statusConfig.variant} className="flex items-center gap-1">
              <StatusIcon
                className={`h-3 w-3 ${statusConfig.color} ${device.status === "connecting" ? "animate-spin" : ""}`}
              />
              {statusConfig.label}
            </Badge>
          </div>

          {device.phoneNumber && (
            <CardDescription className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {device.phoneNumber}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-4 relative z-10">
          {/* معلومات الجهاز */}
          <div className="text-sm text-gray-600 space-y-1">
            {device.lastSeen && <p>آخر ظهور: {new Date(device.lastSeen).toLocaleString("ar-SA")}</p>}
            {device.connectionAttempts > 0 && <p>محاولات الاتصال: {device.connectionAttempts}</p>}
          </div>

          {/* رسالة الخطأ */}
          {showError && device.errorMessage && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              <strong>خطأ:</strong> {device.errorMessage}
            </div>
          )}

          {/* QR Code مع تأثيرات محسنة */}
          {hasQR && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-2"
            >
              <Button variant="outline" size="sm" onClick={() => setShowQR(!showQR)} className="w-full group">
                <QrCode className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                {showQR ? "إخفاء QR Code" : "عرض QR Code"}
              </Button>

              <AnimatePresence>
                {showQR && device.qrCode && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex justify-center p-4 bg-white rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600"
                  >
                    <motion.img
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      src={device.qrCode || "/placeholder.svg"}
                      alt="QR Code"
                      className="max-w-full h-auto rounded-lg shadow-lg"
                      style={{ maxWidth: "200px" }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* أزرار التحكم مع تأثيرات محسنة */}
          <div className="flex gap-2 flex-wrap">
            {canConnect && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                <Button
                  onClick={() => onConnect(device.id)}
                  disabled={isLoading}
                  size="sm"
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wifi className="h-4 w-4 mr-2" />}
                  اتصال
                </Button>
              </motion.div>
            )}

            {canDisconnect && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                <Button
                  onClick={() => onDisconnect(device.id)}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <WifiOff className="h-4 w-4 mr-2" />}
                  قطع الاتصال
                </Button>
              </motion.div>
            )}

            {canSendMessage && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                <Button
                  onClick={() => onSendMessage(device.id)}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  إرسال رسالة
                </Button>
              </motion.div>
            )}

            <Button
              onClick={() => onDelete(device.id)}
              disabled={isLoading}
              variant="destructive"
              size="sm"
              aria-label="حذف الجهاز"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
