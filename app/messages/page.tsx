"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Card,
  CardContent,
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
} from "@/ui"
import { MessageSquare, RefreshCw, Search, CheckCircle, XCircle, Clock, Phone } from "lucide-react"
import { MessageDialog } from "@/components/message-dialog"
import { useApp } from "@/lib/app-context"
import { useWebSocketContext } from "@/lib/websocket-provider"
import { MainLayout } from "@/components/layout/main-layout"
import type { Message, Device } from "@/lib/types"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { logger } from "@/lib/logger"
import { useToast } from "@/hooks/use-toast"

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [deviceFilter, setDeviceFilter] = useState<number | "all">("all")
  const { actions } = useApp()
  const { toast } = useToast()
  const { on } = useWebSocketContext()
  const [messageDialogOpen, setMessageDialogOpen] = useState(false)


  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true)
      const url =
        deviceFilter === "all"
          ? "/api/messages"
          : `/api/messages?deviceId=${deviceFilter}`
      const response = await fetch(url)
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
  }, [deviceFilter, actions])

  const fetchDevices = useCallback(async () => {
    try {
      const response = await fetch("/api/devices")
      const data: { success: boolean; devices?: Device[] } = await response.json()

      if (data.success) {
        setDevices(data.devices || [])
      } else {
        logger.warn("Failed to fetch devices", { error: (data as any).error })
      }
    } catch (err) {
      logger.error("Error fetching devices", err)
      actions.addNotification({
        type: "error",
        title: "خطأ",
        message: "فشل في جلب بيانات الأجهزة",
      })
    }
  }, [actions])




  useEffect(() => {
    fetchMessages()
    fetchDevices()
  }, [deviceFilter, fetchMessages, fetchDevices])

  useEffect(() => {
    const offStatus = on("device_status_changed", (data: any) => {
      const { deviceId, status } = data || {}
      if (deviceId && status) {
        setDevices((prev) => prev.map((d) => (d.id === deviceId ? { ...d, status } : d)))
        actions.addNotification({
          type: "success",
          title: "تحديث الأجهزة",
          message: `تم تحديث حالة الجهاز ${deviceId}`,
        })
      }
    })

    const offSent = on("message_sent", (payload: any) => {
      const deviceId = payload.deviceId
      if (deviceId) {
        const newMessage: Message = {
          id: Date.now(),
          deviceId,
          recipient: payload.recipient,
          message: payload.message,
          status: "sent",
          sentAt: payload.timestamp || new Date().toISOString(),
          messageType: payload.messageType || "text",
        }
        setMessages((prev) => [newMessage, ...prev])
      }
    })

    const offReceived = on("message_received", (payload: any) => {
      actions.addNotification({
        type: "info",
        title: `رسالة واردة من ${payload.sender}`,
        message: payload.message,
      })
    })

    return () => {
      offStatus && offStatus()
      offSent && offSent()
      offReceived && offReceived()
    }
  }, [on, actions])


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
      getDeviceName(message.deviceId).toLowerCase().includes(searchTerm.toLowerCase())

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

  const handleSendMessage = async (
    data:
      | {
          deviceId: number
          recipient?: string
          recipients?: string[]
          message: string
          isBulk: boolean
          file?: File | null
          scheduledAt?: string
          vcard?: string
          isContact?: boolean
          latitude?: number
          longitude?: number
          isLocation?: boolean
        }
      | { deviceId: number; formData: FormData; isMedia: true },
  ) => {
    try {
      let url = data.isBulk
        ? `/api/devices/${data.deviceId}/send-bulk`
        : `/api/devices/${data.deviceId}/send`

      if ('isMedia' in data && data.isMedia) {
        url = `/api/devices/${data.deviceId}/send-media`
      } else if (data.isContact) {
        url = `/api/devices/${data.deviceId}/send-contact`
      } else if (data.file) {
        url = `/api/devices/${data.deviceId}/send-media`
      } else if (data.isLocation) {
        url = `/api/devices/${data.deviceId}/send-location`
      } else if (data.scheduledAt) {
        url = `/api/devices/${data.deviceId}/schedule`
      }

      let res: Response
      if ('isMedia' in data && data.isMedia) {
        res = await fetch(url, {
          method: 'POST',
          credentials: 'include',
          body: data.formData,
        })
      } else if (data.file) {
        const fd = new FormData()
        fd.append('recipient', data.recipient || '')
        fd.append('caption', data.message)
        fd.append('file', data.file)
        res = await fetch(url, {
          method: 'POST',
          credentials: 'include',
          body: fd,
        })
      } else {
        let payload
        if (data.isContact) {
          payload = { recipient: data.recipient, vcard: data.vcard }
        } else if (data.isLocation) {
          payload = {
            recipient: data.recipient,
            latitude: data.latitude,
            longitude: data.longitude,
            description: data.message,
          }
        } else if (data.scheduledAt) {
          payload = { recipient: data.recipient, message: data.message, sendAt: data.scheduledAt }
        } else if (data.isBulk) {
          payload = { recipients: data.recipients, message: data.message }
        } else {
          payload = { recipient: data.recipient, message: data.message }
        }

        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        })
      }

      const resp = await res.json()
      if (!res.ok || !resp.success) {
        throw new Error(resp.error || "فشل إرسال الرسالة")
      }

      toast({
        title: "نجح",
        description: resp.message || "تم إرسال الرسالة",
      })
    } catch (err) {
      logger.error("Error sending message:", err as Error)
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل في إرسال الرسالة",
      })
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إدارة الرسائل</h1>
            <p className="text-gray-600 dark:text-gray-400">عرض وإدارة جميع الرسائل المرسلة</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setMessageDialogOpen(true)} variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              إرسال رسالة
            </Button>
            <Button onClick={fetchMessages} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              تحديث
            </Button>
          </div>
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
                <div className="flex gap-2 flex-wrap items-center">
                  <Select value={deviceFilter.toString()} onValueChange={(val) => setDeviceFilter(val === "all" ? "all" : Number(val))}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="جميع الأجهزة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الأجهزة</SelectItem>
                      {devices.map((d) => (
                        <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

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
                              <span className="text-sm text-gray-500">{getDeviceName(message.deviceId)}</span>
                              <span className="text-sm text-gray-500">
                                {new Date(message.sentAt).toLocaleString("ar-SA")}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{message.recipient}</span>
                            </div>

                            <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                              {message.message}
                            </p>

                            {message.errorMessage && (
                              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-400">
                                <strong>خطأ:</strong> {message.errorMessage}
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
      {devices.length > 0 && (
        <MessageDialog
          open={messageDialogOpen}
          onOpenChange={setMessageDialogOpen}
          devices={devices}
          onSendMessage={handleSendMessage}
        />
      )}
    </MainLayout>
  )
}
