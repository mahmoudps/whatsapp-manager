"use client"

import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare, Smartphone, Activity, Users, TrendingUp, Clock } from "lucide-react"

interface SystemStats {
  devices: {
    total: number
    connected: number
    disconnected: number
    connecting?: number
    error?: number
  }
  messages: {
    total: number
    sent: number
    pending: number
    failed: number
    today?: number
  }
  system?: {
    uptime?: number
    memory?: {
      heapUsed: number
      heapTotal: number
    }
  }
}

interface StatsCardsProps {
  stats: SystemStats
  isLoading?: boolean
}

export function StatsCards({ stats, isLoading = false }: StatsCardsProps) {
  // التأكد من وجود البيانات مع قيم افتراضية
  const devices = stats?.devices || { total: 0, connected: 0, disconnected: 0, connecting: 0, error: 0 }
  const messages = stats?.messages || { total: 0, sent: 0, pending: 0, failed: 0, today: 0 }
  const system = stats?.system || { uptime: 0, memory: { heapUsed: 0, heapTotal: 0 } }

  const formatUptime = (seconds: number) => {
    if (!seconds) return "0 دقيقة"
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours} ساعة ${minutes} دقيقة`
    }
    return `${minutes} دقيقة`
  }

  const formatMemory = (bytes: number) => {
    if (!bytes) return "0 MB"
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* إجمالي الأجهزة */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">إجمالي الأجهزة</p>
              <p className="text-3xl font-bold">{devices.total}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {devices.connected} متصل، {devices.disconnected} غير متصل
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
        </CardContent>
      </Card>

      {/* الأجهزة المتصلة */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">الأجهزة المتصلة</p>
              <p className="text-3xl font-bold text-green-600">{devices.connected}</p>
              <p className="text-xs text-muted-foreground mt-1">جاهزة للاستخدام</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-green-600"></div>
        </CardContent>
      </Card>

      {/* إجمالي الرسائل */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">إجمالي الرسائل</p>
              <p className="text-3xl font-bold">{messages.total}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {messages.sent} مرسلة، {messages.failed} فاشلة
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-purple-600"></div>
        </CardContent>
      </Card>

      {/* الرسائل المرسلة */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">الرسائل المرسلة</p>
              <p className="text-3xl font-bold text-blue-600">{messages.sent}</p>
              <p className="text-xs text-muted-foreground mt-1">{messages.today || 0} اليوم</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
        </CardContent>
      </Card>

      {/* معلومات النظام */}
      {system && (
        <>
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">وقت التشغيل</p>
                  <p className="text-2xl font-bold">{formatUptime(system.uptime || 0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">منذ آخر إعادة تشغيل</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-orange-600"></div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">استخدام الذاكرة</p>
                  <p className="text-2xl font-bold">{formatMemory(system.memory?.heapUsed || 0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">من {formatMemory(system.memory?.heapTotal || 0)}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-red-600"></div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
