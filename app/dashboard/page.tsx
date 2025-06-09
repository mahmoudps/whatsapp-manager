"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity, MessageSquare, Smartphone, Users, RefreshCw, AlertCircle } from "lucide-react"
import { MainLayout } from "@/components/layout/main-layout"
import { logger } from "@/lib/logger"

interface Stats {
  devices: {
    total: number
    connected: number
    disconnected: number
  }
  messages: {
    total: number
    sent: number
    failed: number
    pending: number
  }
  system: {
    uptime: string
    timestamp: string
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    devices: {
      total: 0,
      connected: 0,
      disconnected: 0,
    },
    messages: {
      total: 0,
      sent: 0,
      failed: 0,
      pending: 0,
    },
    system: {
      uptime: "0 ساعة",
      timestamp: new Date().toISOString(),
    },
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const formatUptime = (seconds: number) => {
    if (!seconds) return "0 دقيقة"
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours} ساعة ${minutes} دقيقة`
    return `${minutes} دقيقة`
  }

  const fetchStats = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)

      const [statsRes, systemRes] = await Promise.all([
        fetch("/api/stats", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }),
        fetch("/api/stats/system", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }),
      ])

      if (!statsRes.ok) {
        throw new Error(`HTTP error! status: ${statsRes.status}`)
      }

      const statsData = await statsRes.json()
      if (!statsData.success) {
        throw new Error(statsData.error || "فشل في جلب الإحصائيات")
      }

      let systemData: any = null
      if (systemRes.ok) {
        const sd = await systemRes.json()
        if (sd.success) systemData = sd.data
      }

      const combined: Stats = {
        devices: {
          total: statsData.stats?.totalDevices || 0,
          connected: statsData.stats?.connectedDevices || 0,
          disconnected:
            (statsData.stats?.totalDevices || 0) -
            (statsData.stats?.connectedDevices || 0),
        },
        messages: {
          total: statsData.stats?.totalMessages || 0,
          sent: statsData.stats?.sentMessages || 0,
          failed:
            (statsData.stats?.totalMessages || 0) -
            (statsData.stats?.sentMessages || 0),
          pending: 0,
        },
        system: {
          uptime: systemData ? formatUptime(systemData.system?.uptime || 0) : "0 دقيقة",
          timestamp: systemData?.timestamp || new Date().toISOString(),
        },
      }

      setStats(combined)
    } catch (err) {
      logger.error("Error fetching stats:", err as Error)
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ أثناء جلب الإحصائيات"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleRefresh = () => {
    fetchStats()
  }

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span>جاري تحميل البيانات...</span>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">لوحة التحكم</h1>
          <Button onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </Button>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-red-700">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* إحصائيات سريعة */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الأجهزة</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.devices.total}</div>
              <p className="text-xs text-muted-foreground">{stats.devices.connected} متصل</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الأجهزة المتصلة</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.devices.connected}</div>
              <p className="text-xs text-muted-foreground">من أصل {stats.devices.total} جهاز</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الرسائل</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.messages.total}</div>
              <p className="text-xs text-muted-foreground">{stats.messages.sent} تم إرسالها</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الرسائل المرسلة</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.messages.sent}</div>
              <p className="text-xs text-muted-foreground">{stats.messages.pending} في الانتظار</p>
            </CardContent>
          </Card>
        </div>

        {/* معلومات النظام */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات النظام</CardTitle>
            <CardDescription>حالة النظام والخدمات</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-medium mb-2">مدة التشغيل</h3>
                <p className="text-2xl font-bold text-green-600">{stats.system.uptime}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">آخر تحديث</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(stats.system.timestamp).toLocaleString("ar-SA")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* النشاط الأخير */}
        <Card>
          <CardHeader>
            <CardTitle>النشاط الأخير</CardTitle>
            <CardDescription>آخر الأحداث والتحديثات في النظام</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg border border-green-200 dark:border-green-800">
                <div className="bg-green-500 p-3 rounded-full shadow-md">
                  <Smartphone className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-lg">النظام يعمل بشكل طبيعي</p>
                  <p className="text-muted-foreground">جميع الخدمات تعمل بشكل صحيح</p>
                </div>
                <div className="text-sm text-muted-foreground font-medium">الآن</div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="bg-blue-500 p-3 rounded-full shadow-md">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-lg">قاعدة البيانات متصلة</p>
                  <p className="text-muted-foreground">قاعدة البيانات تعمل بشكل طبيعي</p>
                </div>
                <div className="text-sm text-muted-foreground font-medium">منذ دقيقة</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
