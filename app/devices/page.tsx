"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Smartphone, Plus, Loader2, RefreshCw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { DeviceCard } from "@/components/device-card"
import { MessageDialog } from "@/components/message-dialog"
import { MainLayout } from "@/components/layout/main-layout"
import { useApp } from "@/lib/app-context"
import { useWebSocketContext } from "@/lib/websocket-provider"
import { logger } from "@/lib/logger"

interface Device {
  id: number
  name: string
  status: string
  phoneNumber?: string
  lastSeen?: string
  errorMessage?: string
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newDeviceName, setNewDeviceName] = useState("")
  const [isAddingDevice, setIsAddingDevice] = useState(false)
  const [messageDialogOpen, setMessageDialogOpen] = useState(false)
  const [activeDevice, setActiveDevice] = useState<{ id: number; name: string } | null>(null)
  const { actions } = useApp()
  const { on } = useWebSocketContext()

  useEffect(() => {
    fetchDevices()
  }, [fetchDevices])

  useEffect(() => {
    const offStatus = on("device_status_changed", (data: any) => {
      setDevices((prev) =>
        prev.map((d) => (d.id === data.deviceId ? { ...d, ...data } : d)),
      )
    })

    const offQR = on("qr_code_generated", (data: any) => {
      setDevices((prev) =>
        prev.map((d) =>
          d.id === data.deviceId ? { ...d, qrCode: data.qrCode } : d,
        ),
      )
    })

    return () => {
      offStatus && offStatus()
      offQR && offQR()
    }
  }, [on])

  const fetchDevices = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/devices", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setDevices(data.devices || [])
      } else {
        throw new Error(data.error || "فشل في جلب الأجهزة")
      }
    } catch (err) {
      logger.error("Error fetching devices:", err as Error)
      actions.addNotification({
        type: "error",
        title: "خطأ",
        message: "فشل في جلب الأجهزة",
      })
    } finally {
      setIsLoading(false)
    }
  }, [actions])

  const handleAddDevice = async () => {
    if (!newDeviceName.trim()) {
      actions.addNotification({
        type: "warning",
        title: "تنبيه",
        message: "الرجاء إدخال اسم للجهاز",
      })
      return
    }

    setIsAddingDevice(true)
    try {
      const response = await fetch("/api/devices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name: newDeviceName.trim() }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        actions.addNotification({
          type: "success",
          title: "نجح",
          message: "تم إضافة الجهاز بنجاح",
        })
        setNewDeviceName("")
        if (data.device) {
          setDevices((prev) => [...prev, data.device])
        } else {
          await fetchDevices()
        }
      } else {
        throw new Error(data.error || "فشل إضافة الجهاز")
      }
    } catch (err) {
      logger.error("Error adding device:", err as Error)
      actions.addNotification({
        type: "error",
        title: "خطأ",
        message: "فشل في إضافة الجهاز",
      })
    } finally {
      setIsAddingDevice(false)
    }
  }

  const handleConnect = async (deviceId: number) => {
    try {
      const res = await fetch(`/api/devices/${deviceId}/connect`, {
        method: "POST",
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل الاتصال بالجهاز")
      }
      actions.addNotification({
        type: "success",
        title: "نجح",
        message: data.message || "تم بدء الاتصال بالجهاز",
      })
      setDevices((prev) =>
        prev.map((d) =>
          d.id === deviceId ? { ...d, status: "connecting" } : d,
        ),
      )
    } catch (err) {
      logger.error("Error connecting device:", err as Error)
      actions.addNotification({
        type: "error",
        title: "خطأ",
        message: "فشل الاتصال بالجهاز",
      })
    }
  }

  const handleDisconnect = async (deviceId: number) => {
    try {
      const res = await fetch(`/api/devices/${deviceId}/disconnect`, {
        method: "POST",
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل قطع الاتصال")
      }
      actions.addNotification({
        type: "success",
        title: "نجح",
        message: data.message || "تم قطع الاتصال",
      })
      setDevices((prev) =>
        prev.map((d) =>
          d.id === deviceId ? { ...d, status: "disconnected" } : d,
        ),
      )
    } catch (err) {
      logger.error("Error disconnecting device:", err as Error)
      actions.addNotification({
        type: "error",
        title: "خطأ",
        message: "فشل في قطع الاتصال",
      })
    }
  }

  const handleDelete = async (deviceId: number) => {
    try {
      const res = await fetch(`/api/devices/${deviceId}`, {
        method: "DELETE",
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل حذف الجهاز")
      }
      actions.addNotification({
        type: "success",
        title: "نجح",
        message: data.message || "تم حذف الجهاز",
      })
      setDevices((prev) => prev.filter((d) => d.id !== deviceId))
    } catch (err) {
      logger.error("Error deleting device:", err as Error)
      actions.addNotification({
        type: "error",
        title: "خطأ",
        message: "فشل في حذف الجهاز",
      })
    }
  }

  const openMessageDialog = (deviceId: number) => {
    const device = devices.find((d) => d.id === deviceId)
    if (device) {
      setActiveDevice({ id: device.id, name: device.name })
      setMessageDialogOpen(true)
    }
  }

  const fileToBase64 = async (file: File) => {
    const reader = new FileReader()
    return await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = () => reject(new Error('failed'))
      reader.readAsDataURL(file)
    })
  }

  const handleSendMessage = async (data: {
    deviceId: number
    recipient?: string
    recipients?: string[]
    message: string
    isBulk: boolean
    file?: File | null
    scheduledAt?: string
  }) => {
    try {
      let url = data.isBulk
        ? `/api/devices/${data.deviceId}/send-bulk`
        : `/api/devices/${data.deviceId}/send`

      if (data.file) {
        url = `/api/devices/${data.deviceId}/send-media`
      } else if (data.scheduledAt) {
        url = `/api/devices/${data.deviceId}/schedule`
      }

      let payload
      if (data.file) {
        payload = {
          recipient: data.recipient,
          data: await fileToBase64(data.file),
          mimeType: data.file.type,
          caption: data.message,
        }
      } else if (data.scheduledAt) {
        payload = { recipient: data.recipient, message: data.message, sendAt: data.scheduledAt }
      } else if (data.isBulk) {
        payload = { recipients: data.recipients, message: data.message }
      } else {
        payload = { recipient: data.recipient, message: data.message }
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const resp = await res.json()
      if (!res.ok || !resp.success) {
        throw new Error(resp.error || "فشل إرسال الرسالة")
      }

      actions.addNotification({
        type: "success",
        title: "نجح",
        message: resp.message || "تم إرسال الرسالة",
      })
    } catch (err) {
      logger.error("Error sending message:", err as Error)
      actions.addNotification({
        type: "error",
        title: "خطأ",
        message: "فشل في إرسال الرسالة",
      })
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse space-y-4">
              <CardHeader>
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">إدارة الأجهزة</h1>
          <Button onClick={fetchDevices} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            تحديث
          </Button>
        </div>

        {/* إضافة جهاز جديد */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              إضافة جهاز جديد
            </CardTitle>
            <CardDescription>أضف جهاز WhatsApp جديد للنظام</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="اسم الجهاز (مثال: جهاز المبيعات)"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                disabled={isAddingDevice}
                className="flex-1"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !isAddingDevice) {
                    handleAddDevice()
                  }
                }}
              />
              <Button onClick={handleAddDevice} disabled={isAddingDevice || !newDeviceName.trim()}>
                {isAddingDevice ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                {isAddingDevice ? "جاري الإضافة..." : "إضافة"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* قائمة الأجهزة */}
        {devices.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Smartphone className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">لا توجد أجهزة</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">ابدأ بإضافة جهاز WhatsApp جديد للنظام</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device as any}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onDelete={handleDelete}
                onSendMessage={openMessageDialog}
              />
            ))}
          </div>
        )}
      </div>
      {activeDevice && (
        <MessageDialog
          open={messageDialogOpen}
          onOpenChange={setMessageDialogOpen}
          deviceId={activeDevice.id}
          deviceName={activeDevice.name}
          onSendMessage={handleSendMessage}
        />
      )}
    </MainLayout>
  )
}
