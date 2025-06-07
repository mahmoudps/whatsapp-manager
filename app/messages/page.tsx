"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, RefreshCw, Search, CheckCircle, XCircle, Clock, Phone } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { MainLayout } from "@/components/layout/main-layout"
import type { Message, Device } from "@/lib/types"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { logger } from "@/lib/logger"

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { actions } = useApp()
  const ws = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)

  useEffect(() => {
    fetchMessages()
    fetchDevices()
    const interval = setInterval(fetchMessages, 15000)
    return () => {
      clearInterval(interval)
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [])

  useEffect(() => {
    const connectWebSocket = () => {
      const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8080"
      logger.info("Attempting to connect to WebSocket", { url: wsUrl, attempt: reconnectAttempts.current + 1 })

      ws.current = new WebSocket(wsUrl)

      ws.current.onopen = () => {
        logger.info("WebSocket connected successfully")
        reconnectAttempts.current = 0 // Reset attempts on successful connection
      }

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          logger.debug("WebSocket message received", { type: data.type })

          if (data.type === "message_update") {
            fetchMessages()
          } else if (data.type === "device_update") {
            fetchDevices()
            actions.addNotification({
              type: "success",
              title: "تحديث الأجهزة",
              message: "تم تحديث حالة الأجهزة",
            })
          }
        } catch (error) {
          logger.error("Error parsing WebSocket message", error)
        }
      }

      ws.current.onclose = (event) => {
        logger.warn("WebSocket disconnected", { code: event.code, reason: event.reason })
        if (reconnectAttempts.current < 5) {
          // Limit reconnection attempts
          const delay = Math.pow(2, reconnectAttempts.current) * 1000 // Exponential backoff
          logger.info(`Attempting to reconnect in ${delay / 1000}s`)
          setTimeout(connectWebSocket, delay)
          reconnectAttempts.current++
        } else {
          logger.error("Max reconnection attempts reached. Please check server and network.")
        }
      }

      ws.current.onerror = (error) => {
        logger.error("WebSocket error", error)
        // onclose will be called, triggering reconnection logic
        // ws.current?.close() // No need to close here, onclose handles it
      }
    }

    connectWebSocket()

    return () => {
      if (ws.current) {
        ws.current.close()
        ws.current = null
      }
    }
  }, [actions])

  const fetchMessages = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/messages")
      const data = await response.json()

      if (data.success) {
        setMessages(data.data)
      } else {
        throw new Error(data.error || "فشل في جلب الرسائل")
      }
    } catch (err) {
      logger.error("Error fetching messages", err)
      actions.addNotification({
        type: "error",
        title: "خطأ",
        message: (err as Error).message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDevices = async () => {
    try {
      const response = await fetch("/api/devices")
      const data = await response.json()

      if (data.success) {
        setDevices(data.data)
      } else {
        logger.warn("Failed to fetch devices", { error: data.error })
      }
    } catch (err) {
      logger.error("Error fetching devices", err)
      actions.addNotification({
        type: "error",
        title: "خطأ",
        message: "فشل في جلب بيانات الأجهزة",
      })
    }
  }

  const getDeviceName = (deviceId: number) => {
    const device = devices.find((d) => d.id === deviceId)
    return device?.name || `جهاز ${deviceId}`
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "sent":
        return {
          label: "تم الإرسال",
          variant: "default" as const,
          icon: CheckCircle,
          color: "text-green-600",
        }
      case "failed":
        return {
          label: "فشل",
          variant: "destructive" as const,
          icon: XCircle,
          color: "text-red-600",
        }
      case "pending":
        return {
          label: "في الانتظار",
          variant: "secondary" as const,
          icon: Clock,
          color: "text-yellow-600",
        }
      default:
        return {
          label: status,
          variant: "outline" as const,
          icon: Clock,
          color: "text-gray-600",
        }
    }
  }

  const filteredMessages = messages.filter((message) => {
    const matchesSearch =
      message.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getDeviceName(message.device_id).toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || message.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getMessageStats = () => {
    return {
      total: messages.length,
      sent: messages.filter((m) => m.status === "sent").length,
      pending: messages.filter((m) => m.status === "pending").length,
      failed: messages.filter((m) => m.status === "failed").length,
    }
  }

  const stats = getMessageStats()

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إدارة الرسائل</h1>
            <p className="text-gray-600 dark:text-gray-400">عرض وإدارة جميع الرسائل المرسلة</p>
          </div>
          <Button onClick={fetchMessages} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            تحديث
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">الإجمالي</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">تم الإرسال</p>
                  <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">في الانتظار</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">فشل</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative group">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      placeholder="البحث في الرسائل والمستلمين..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10 focus:ring-2 focus:ring-blue-500/20 border-gray-200 dark:border-gray-700"
                    />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { key: "all", label: "الكل", count: stats.total },
                    { key: "sent", label: "مرسلة", count: stats.sent },
                    { key: "pending", label: "انتظار", count: stats.pending },
                    { key: "failed", label: "فاشلة", count: stats.failed },
                  ].map((filter) => (
                    <motion.div key={filter.key} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant={statusFilter === filter.key ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStatusFilter(filter.key)}
                        className={cn(
                          "relative overflow-hidden",
                          statusFilter === filter.key && "bg-gradient-to-r from-blue-500 to-purple-600",
                        )}
                      >
                        {filter.label}
                        <Badge variant="secondary" className="mr-2 bg-white/20 text-white border-0">
                          {filter.count}
                        </Badge>
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center items-center h-64"
            >
              <div className="text-center space-y-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"
                />
                <p className="text-muted-foreground">جاري تحميل الرسائل...</p>
              </div>
            </motion.div>
          ) : filteredMessages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
                <CardContent className="p-12 text-center">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  >
                    <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {messages.length === 0 ? "لا توجد رسائل" : "لا توجد نتائج"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {messages.length === 0 ? "لم يتم إرسال أي رسائل بعد" : "جرب تغيير معايير البحث أو الفلترة"}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {filteredMessages.map((message, index) => {
                const statusConfig = getStatusConfig(message.status)
                const StatusIcon = statusConfig.icon

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                                <StatusIcon className={`h-3 w-3 ${statusConfig.color}`} />
                                {statusConfig.label}
                              </Badge>
                              <span className="text-sm text-gray-500">{getDeviceName(message.device_id)}</span>
                              <span className="text-sm text-gray-500">
                                {new Date(message.sent_at).toLocaleString("ar-SA")}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{message.recipient}</span>
                            </div>

                            <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                              {message.message}
                            </p>

                            {message.error_message && (
                              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-400">
                                <strong>خطأ:</strong> {message.error_message}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  )
}
