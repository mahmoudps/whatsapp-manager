"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Smartphone, Plus, Loader2, Wifi, WifiOff, RefreshCw, AlertTriangle } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { MainLayout } from "@/components/layout/main-layout"
import { DeviceCard } from "@/components/device-card"
import { MessageDialog } from "@/components/message-dialog"
import type { Device } from "@/lib/types"

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newDeviceName, setNewDeviceName] = useState("")
  const [isAddingDevice, setIsAddingDevice] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [messageDialogOpen, setMessageDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  const { actions } = useApp()

  // إصلاح مشكلة Hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchDevices()
      const interval = setInterval(fetchDevices, 10000) // تحديث كل 10 ثوان
      return () => clearInterval(interval)
    }
  }, [mounted])

  const fetchDevices = async () => {
    try {
      console.log("🔄 Fetching devices...")

      const response = await fetch("/api/devices", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // تضمين الكوكيز
      })

      console.log("📡 Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ API Error:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log("✅ Devices data:", data)

      if (data.success) {
        setDevices(data.devices || [])
        console.log(`📱 Loaded ${data.devices?.length || 0} devices`)
      } else {
        throw new Error(data.error || "فشل في جلب الأجهزة")
      }
    } catch (err) {
      console.error("❌ Error fetching devices:", err)
      if (mounted) {
        actions.addNotification({
          type: "error",
          title: "خطأ في جلب الأجهزة",
          message: err instanceof Error ? err.message : "حدث خطأ غير متوقع",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

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
    console.log("🔄 Adding new device:", newDeviceName)

    try {
      const response = await fetch("/api/devices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name: newDeviceName.trim() }),
      })

      console.log("📡 Add device response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Add device error:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log("✅ Device added:", data)

      if (data.success) {
        actions.addNotification({
          type: "success",
          title: "نجح الإضافة",
          message: `تم إضافة الجهاز "${data.device?.name || newDeviceName}" بنجاح`,
        })
        setNewDeviceName("")
        await fetchDevices() // إعادة تحميل القائمة
      } else {
        throw new Error(data.error || "فشل إضافة الجهاز")
      }
    } catch (err) {
      console.error("❌ Error adding device:", err)
      actions.addNotification({
        type: "error",
        title: "خطأ في إضافة الجهاز",
        message: err instanceof Error ? err.message : "حدث خطأ غير متوقع",
      })
    } finally {
      setIsAddingDevice(false)
    }
  }

  const handleConnect = async (deviceId: number) => {
    setActionLoading(deviceId)
    console.log("🔄 Connecting device:", deviceId)

    try {
      const response = await fetch(`/api/devices/${deviceId}/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      console.log("📡 Connect response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Connect error:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log("✅ Connect result:", data)

      if (data.success) {
        actions.addNotification({
          type: "success",
          title: "بدء الاتصال",
          message: "تم بدء عملية الاتصال بنجاح",
        })
        await fetchDevices()
      } else {
        throw new Error(data.error || "فشل في الاتصال")
      }
    } catch (err) {
      console.error("❌ Error connecting device:", err)
      actions.addNotification({
        type: "error",
        title: "خطأ في الاتصال",
        message: err instanceof Error ? err.message : "حدث خطأ أثناء الاتصال",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDisconnect = async (deviceId: number) => {
    setActionLoading(deviceId)
    console.log("🔄 Disconnecting device:", deviceId)

    try {
      const response = await fetch(`/api/devices/${deviceId}/disconnect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Disconnect error:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()

      if (data.success) {
        actions.addNotification({
          type: "success",
          title: "قطع الاتصال",
          message: "تم قطع الاتصال بنجاح",
        })
        await fetchDevices()
      } else {
        throw new Error(data.error || "فشل في قطع الاتصال")
      }
    } catch (err) {
      console.error("❌ Error disconnecting device:", err)
      actions.addNotification({
        type: "error",
        title: "خطأ في قطع الاتصال",
        message: err instanceof Error ? err.message : "حدث خطأ أثناء قطع الاتصال",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (deviceId: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الجهاز؟")) {
      return
    }

    setActionLoading(deviceId)
    console.log("🔄 Deleting device:", deviceId)

    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Delete error:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()

      if (data.success) {
        actions.addNotification({
          type: "success",
          title: "حذف الجهاز",
          message: "تم حذف الجهاز بنجاح",
        })
        await fetchDevices()
      } else {
        throw new Error(data.error || "فشل في حذف الجهاز")
      }
    } catch (err) {
      console.error("❌ Error deleting device:", err)
      actions.addNotification({
        type: "error",
        title: "خطأ في حذف الجهاز",
        message: err instanceof Error ? err.message : "حدث خطأ أثناء حذف الجهاز",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleSendMessage = (deviceId: number) => {
    const device = devices.find((d) => d.id === deviceId)
    if (device) {
      setSelectedDevice(device)
      setMessageDialogOpen(true)
    }
  }

  const handleSendMessageSubmit = async (data: {
    deviceId: number
    recipient?: string
    recipients?: string[]
    message: string
    isBulk: boolean
  }) => {
    try {
      console.log("🔄 Sending message:", data)

      const endpoint = data.isBulk ? `/api/devices/${data.deviceId}/send-bulk` : `/api/devices/${data.deviceId}/send`

      const body = data.isBulk
        ? { recipients: data.recipients, message: data.message }
        : { recipient: data.recipient, message: data.message }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Send message error:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      console.log("✅ Message sent:", result)

      if (result.success) {
        actions.addNotification({
          type: "success",
          title: "إرسال الرسالة",
          message: data.isBulk ? "تم إرسال الرسائل الجماعية بنجاح" : "تم إرسال الرسالة بنجاح",
        })
      } else {
        throw new Error(result.error || "فشل في إرسال الرسالة")
      }
    } catch (err) {
      console.error("❌ Error sending message:", err)
      actions.addNotification({
        type: "error",
        title: "خطأ في إرسال الرسالة",
        message: err instanceof Error ? err.message : "حدث خطأ أثناء إرسال الرسالة",
      })
    }
  }

  const getStatusStats = () => {
    const stats = {
      total: devices.length,
      connected: devices.filter((d) => d.status === "connected").length,
      disconnected: devices.filter((d) => d.status === "disconnected").length,
      connecting: devices.filter((d) => d.status === "connecting" || d.status === "qr_ready").length,
      error: devices.filter((d) => d.status === "error" || d.status === "auth_failed").length,
    }
    return stats
  }

  // عدم عرض أي شيء حتى يتم mount المكون (إصلاح Hydration)
  if (!mounted) {
    return null
  }

  const stats = getStatusStats()

  // التحقق من حالة التحميل
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p>جاري تحميل الأجهزة...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إدارة الأجهزة</h1>
            <p className="text-gray-600 dark:text-gray-400">إدارة أجهزة WhatsApp المتصلة بالنظام</p>
          </div>
          <Button onClick={fetchDevices} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            تحديث
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">الإجمالي</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Smartphone className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">متصل</p>
                  <p className="text-2xl font-bold text-green-600">{stats.connected}</p>
                </div>
                <Wifi className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">غير متصل</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.disconnected}</p>
                </div>
                <WifiOff className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">يتصل</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.connecting}</p>
                </div>
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">خطأ</p>
                  <p className="text-2xl font-bold text-red-600">{stats.error}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Device */}
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

        {/* Devices Grid */}
        {devices.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Smartphone className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">لا توجد أجهزة</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">ابدأ بإضافة جهاز WhatsApp جديد للنظام</p>
              <Button
                onClick={() => {
                  setNewDeviceName("جهاز 1")
                  setTimeout(() => handleAddDevice(), 100)
                }}
                disabled={isAddingDevice}
              >
                <Plus className="h-4 w-4 mr-2" />
                إضافة أول جهاز
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onDelete={handleDelete}
                onSendMessage={handleSendMessage}
                isLoading={actionLoading === device.id}
              />
            ))}
          </div>
        )}

        {/* Message Dialog */}
        {selectedDevice && (
          <MessageDialog
            open={messageDialogOpen}
            onOpenChange={setMessageDialogOpen}
            deviceId={selectedDevice.id}
            deviceName={selectedDevice.name}
            onSendMessage={handleSendMessageSubmit}
          />
        )}
      </div>
    </MainLayout>
  )
}
