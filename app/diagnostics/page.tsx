"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, CheckCircle, XCircle, AlertTriangle, Network, Server } from "lucide-react"
import { MainLayout } from "@/components/layout/main-layout"

interface SystemStatus {
  api: {
    status: "online" | "offline" | "error" | "checking"
    message: string
    latency?: number
  }
  websocket: {
    status: "online" | "offline" | "error" | "checking"
    message: string
    clients?: number
    config?: {
      enabled: boolean
      url?: string
      port?: string
    }
  }
  database: {
    status: "online" | "offline" | "error" | "checking"
    message: string
  }
}

interface EnvConfig {
  PORT: number
  WHATSAPP_SERVER_PORT: number
  WEBSOCKET_PORT: number
  ENABLE_WEBSOCKET: boolean
  DATABASE_PATH: string
}

export default function DiagnosticsPage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    api: { status: "checking", message: "جاري التحقق..." },
    websocket: { status: "checking", message: "جاري التحقق..." },
    database: { status: "checking", message: "جاري التحقق..." },
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [envVars, setEnvVars] = useState<EnvConfig | null>(null)

  const checkSystemStatus = useCallback(async () => {
    setIsRefreshing(true)

    // جلب متغيرات البيئة من الخادم
    await fetchEnvVariables()

    // تحقق من حالة API
    await checkApiStatus()

    // تحقق من حالة WebSocket
    await checkWebSocketStatus()

    // تحقق من حالة قاعدة البيانات
    await checkDatabaseStatus()

    setIsRefreshing(false)
  }, [])

  useEffect(() => {
    checkSystemStatus()
  }, [checkSystemStatus])

  const checkApiStatus = async () => {
    try {
      const startTime = Date.now()
      const response = await fetch("/api/health")
      const latency = Date.now() - startTime

      if (response.ok) {
        const data = await response.json()
        setSystemStatus((prev) => ({
          ...prev,
          api: {
            status: "online",
            message: "API متصل ويعمل بشكل صحيح",
            latency,
          },
        }))
      } else {
        setSystemStatus((prev) => ({
          ...prev,
          api: {
            status: "error",
            message: `خطأ في API: ${response.status} ${response.statusText}`,
            latency,
          },
        }))
      }
    } catch (error) {
      setSystemStatus((prev) => ({
        ...prev,
        api: {
          status: "offline",
          message: `فشل الاتصال بـ API: ${(error as Error).message}`,
        },
      }))
    }
  }

  const checkWebSocketStatus = async () => {
    try {
      const response = await fetch("/api/socket/status")

      if (response.ok) {
        const data = await response.json()
        setSystemStatus((prev) => ({
          ...prev,
          websocket: {
            status: data.success && data.status === "running" ? "online" : "offline",
            message: data.message,
            clients: data.clients,
            config: data.config,
          },
        }))
      } else {
        setSystemStatus((prev) => ({
          ...prev,
          websocket: {
            status: "error",
            message: `خطأ في WebSocket: ${response.status} ${response.statusText}`,
          },
        }))
      }
    } catch (error) {
      setSystemStatus((prev) => ({
        ...prev,
        websocket: {
          status: "offline",
          message: `فشل التحقق من حالة WebSocket: ${(error as Error).message}`,
        },
      }))
    }
  }

  const checkDatabaseStatus = async () => {
    try {
      const response = await fetch("/api/health?check=database")

      if (response.ok) {
        const data = await response.json()
        setSystemStatus((prev) => ({
          ...prev,
          database: {
            status: data.database?.connected ? "online" : "offline",
            message: data.database?.message || "تم الاتصال بقاعدة البيانات",
          },
        }))
      } else {
        setSystemStatus((prev) => ({
          ...prev,
          database: {
            status: "error",
            message: `خطأ في قاعدة البيانات: ${response.status} ${response.statusText}`,
          },
        }))
      }
    } catch (error) {
      setSystemStatus((prev) => ({
        ...prev,
        database: {
          status: "offline",
          message: `فشل التحقق من حالة قاعدة البيانات: ${(error as Error).message}`,
        },
      }))
    }
  }

  const fetchEnvVariables = async () => {
    try {
      const response = await fetch("/api/env")
      if (response.ok) {
        const data = await response.json()
        setEnvVars(data)
      }
    } catch (error) {
      setEnvVars(null)
    }
  }

  const getStatusBadge = (status: "online" | "offline" | "error" | "checking") => {
    switch (status) {
      case "online":
        return (
          <Badge variant={"success" as any} className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> متصل
          </Badge>
        )
      case "offline":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" /> غير متصل
          </Badge>
        )
      case "error":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> خطأ
          </Badge>
        )
      case "checking":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> جاري التحقق
          </Badge>
        )
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">تشخيص النظام</h1>
            <p className="text-gray-600 dark:text-gray-400">تحقق من حالة مكونات النظام المختلفة</p>
          </div>
          <Button onClick={checkSystemStatus} variant="outline" size="sm" disabled={isRefreshing}>
            {isRefreshing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            تحديث
          </Button>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* API Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                حالة API
              </CardTitle>
              <CardDescription>التحقق من اتصال واستجابة API</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">الحالة:</span>
                  {getStatusBadge(systemStatus.api.status)}
                </div>
                <div>
                  <span className="font-medium">الرسالة:</span>
                  <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">{systemStatus.api.message}</p>
                </div>
                {systemStatus.api.latency && (
                  <div>
                    <span className="font-medium">زمن الاستجابة:</span>
                    <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                      {systemStatus.api.latency} مللي ثانية
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* WebSocket Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                حالة WebSocket
              </CardTitle>
              <CardDescription>التحقق من اتصال وتكوين WebSocket</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">الحالة:</span>
                  {getStatusBadge(systemStatus.websocket.status)}
                </div>
                <div>
                  <span className="font-medium">الرسالة:</span>
                  <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">{systemStatus.websocket.message}</p>
                </div>
                {systemStatus.websocket.clients !== undefined && (
                  <div>
                    <span className="font-medium">العملاء المتصلين:</span>
                    <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">{systemStatus.websocket.clients}</p>
                  </div>
                )}
                {systemStatus.websocket.config && (
                  <div className="border-t pt-3 mt-3">
                    <span className="font-medium">التكوين:</span>
                    <div className="text-sm mt-2 space-y-1 text-gray-600 dark:text-gray-400">
                      <p>تمكين: {systemStatus.websocket.config.enabled ? "نعم" : "لا"}</p>
                      <p>URL: {systemStatus.websocket.config.url || "غير محدد"}</p>
                      <p>المنفذ: {systemStatus.websocket.config.port || "غير محدد"}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Database Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                حالة قاعدة البيانات
              </CardTitle>
              <CardDescription>التحقق من اتصال قاعدة البيانات</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">الحالة:</span>
                  {getStatusBadge(systemStatus.database.status)}
                </div>
                <div>
                  <span className="font-medium">الرسالة:</span>
                  <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">{systemStatus.database.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Environment Variables */}
        <Card>
          <CardHeader>
            <CardTitle>متغيرات البيئة</CardTitle>
            <CardDescription>متغيرات البيئة المهمة للنظام</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">متغيرات الخادم</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>PORT:</strong> {envVars?.PORT ?? "غير متاح"}
                  </p>
                  <p>
                    <strong>WHATSAPP_SERVER_PORT:</strong> {envVars?.WHATSAPP_SERVER_PORT ?? "غير متاح"}
                  </p>
                  <p>
                    <strong>WEBSOCKET_PORT:</strong> {envVars?.WEBSOCKET_PORT ?? "غير متاح"}
                  </p>
                  <p>
                    <strong>ENABLE_WEBSOCKET:</strong> {envVars?.ENABLE_WEBSOCKET !== undefined ? String(envVars.ENABLE_WEBSOCKET) : "غير متاح"}
                  </p>
                  <p>
                    <strong>DATABASE_PATH:</strong> {envVars?.DATABASE_PATH ?? "غير متاح"}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">متغيرات العميل</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>NEXT_PUBLIC_DOMAIN_NAME:</strong> {process.env.NEXT_PUBLIC_DOMAIN_NAME || "غير محدد"}
                  </p>
                  <p>
                    <strong>NEXT_PUBLIC_WEBSOCKET_URL:</strong> {process.env.NEXT_PUBLIC_WEBSOCKET_URL || "غير محدد"}
                  </p>
                  <p>
                    <strong>NEXT_PUBLIC_WHATSAPP_API_URL:</strong>{" "}
                    {process.env.NEXT_PUBLIC_WHATSAPP_API_URL || "غير محدد"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Browser Information */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات المتصفح</CardTitle>
            <CardDescription>معلومات عن المتصفح والاتصال</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                <strong>المتصفح:</strong> {typeof navigator !== "undefined" ? navigator.userAgent : "غير متاح"}
              </p>
              <p>
                <strong>اتصال الإنترنت:</strong>{" "}
                {typeof navigator !== "undefined" && navigator.onLine ? "متصل" : "غير متصل"}
              </p>
              <p>
                <strong>اللغة:</strong> {typeof navigator !== "undefined" ? navigator.language : "غير متاح"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
