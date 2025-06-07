"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Smartphone, Plus, Loader2, RefreshCw } from "lucide-react"
import { MainLayout } from "@/components/layout/main-layout"
import { useApp } from "@/lib/app-context"

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
  const { actions } = useApp()

  useEffect(() => {
    fetchDevices()
  }, [])

  const fetchDevices = async () => {
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
      console.error("Error fetching devices:", err)
      actions.addNotification({
        type: "error",
        title: "خطأ",
        message: "فشل في جلب الأجهزة",
      })
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
        await fetchDevices()
      } else {
        throw new Error(data.error || "فشل إضافة الجهاز")
      }
    } catch (err) {
      console.error("Error adding device:", err)
      actions.addNotification({
        type: "error",
        title: "خطأ",
        message: "فشل في إضافة الجهاز",
      })
    } finally {
      setIsAddingDevice(false)
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span>جاري تحميل الأجهزة...</span>
          </div>
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
              <Card key={device.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{device.name}</CardTitle>
                  <CardDescription>الحالة: {device.status}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <strong>الرقم:</strong> {device.phoneNumber || "لم يتم تعيين رقم"}
                    </p>
                    {device.lastSeen && (
                      <p className="text-sm text-gray-600">
                        <strong>آخر ظهور:</strong> {new Date(device.lastSeen).toLocaleString("ar-SA")}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
