"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MainLayout } from "@/components/layout/main-layout"
import {
  Smartphone,
  MessageSquare,
  Users,
  Activity,
  ArrowUpRight,
  RefreshCw,
  Loader2,
  TrendingUp,
  Shield,
  Clock,
} from "lucide-react"
import { useApp } from "@/lib/app-context"

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalDevices: 0,
    connectedDevices: 0,
    totalMessages: 0,
    messagesSent: 0,
    messagesDelivered: 0,
    activeUsers: 0,
    systemUptime: "0 ساعة",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const { actions } = useApp()

  // إصلاح مشكلة Hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchStats()
      const interval = setInterval(fetchStats, 30000) // تحديث كل 30 ثانية
      return () => clearInterval(interval)
    }
  }, [mounted])

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/stats", {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
      } else {
        throw new Error(data.error || "فشل في جلب الإحصائيات")
      }
    } catch (err) {
      console.error("Error fetching stats:", err)
      actions.addNotification({
        type: "error",
        title: "خطأ",
        message: err instanceof Error ? err.message : "حدث خطأ أثناء جلب الإحصائيات",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // عدم عرض أي شيء حتى يتم mount المكون (إصلاح Hydration)
  if (!mounted) {
    return null
  }

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gradient mb-2">لوحة التحكم</h1>
            <p className="text-lg text-muted-foreground">مرحباً بك في نظام إدارة WhatsApp المتقدم</p>
          </div>
          <Button
            onClick={fetchStats}
            variant="outline"
            size="lg"
            disabled={isLoading}
            className="shadow-md hover:shadow-lg"
          >
            {isLoading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <RefreshCw className="h-5 w-5 mr-2" />}
            تحديث البيانات
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card
            variant="interactive"
            className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center justify-between">
                <span>الأجهزة المتصلة</span>
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Smartphone className="h-6 w-6 text-white" />
                </div>
              </CardTitle>
              <CardDescription className="text-base">إجمالي الأجهزة المسجلة في النظام</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2 text-blue-700 dark:text-blue-300">{stats.totalDevices}</div>
              <div className="text-sm text-green-600 dark:text-green-400 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="font-medium">{stats.connectedDevices} متصل الآن</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                asChild
              >
                <a href="/devices">
                  إدارة الأجهزة
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                </a>
              </Button>
            </CardFooter>
          </Card>

          <Card
            variant="interactive"
            className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center justify-between">
                <span>الرسائل المرسلة</span>
                <div className="p-2 bg-green-500 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
              </CardTitle>
              <CardDescription className="text-base">إجمالي الرسائل المرسلة بنجاح</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2 text-green-700 dark:text-green-300">{stats.totalMessages}</div>
              <div className="text-sm text-green-600 dark:text-green-400 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="font-medium">{stats.messagesDelivered} تم تسليمها</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-green-600 hover:text-green-700 hover:bg-green-50"
                asChild
              >
                <a href="/messages">
                  عرض الرسائل
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                </a>
              </Button>
            </CardFooter>
          </Card>

          <Card
            variant="interactive"
            className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center justify-between">
                <span>المستخدمين النشطين</span>
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </CardTitle>
              <CardDescription className="text-base">عدد المستخدمين المتصلين حالياً</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2 text-purple-700 dark:text-purple-300">{stats.activeUsers}</div>
              <div className="text-sm text-purple-600 dark:text-purple-400 flex items-center">
                <Activity className="h-4 w-4 mr-1" />
                <span className="font-medium">نشط حالياً</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                asChild
              >
                <a href="/users">
                  إدارة المستخدمين
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                </a>
              </Button>
            </CardFooter>
          </Card>

          <Card
            variant="interactive"
            className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center justify-between">
                <span>حالة النظام</span>
                <div className="p-2 bg-amber-500 rounded-lg">
                  <Activity className="h-6 w-6 text-white" />
                </div>
              </CardTitle>
              <CardDescription className="text-base">مدة تشغيل النظام بدون انقطاع</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2 text-amber-700 dark:text-amber-300">{stats.systemUptime}</div>
              <div className="text-sm text-amber-600 dark:text-amber-400 flex items-center">
                <Shield className="h-4 w-4 mr-1" />
                <span className="font-medium">يعمل بشكل مثالي</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                asChild
              >
                <a href="/diagnostics">
                  فحص النظام
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card variant="elevated" className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Clock className="h-6 w-6 text-primary" />
              النشاط الأخير
            </CardTitle>
            <CardDescription className="text-lg">آخر الأحداث والتحديثات في النظام</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg border border-green-200 dark:border-green-800 animate-slide-in-right">
                    <div className="bg-green-500 p-3 rounded-full shadow-md">
                      <Smartphone className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-lg">تم اتصال جهاز جديد</p>
                      <p className="text-muted-foreground">جهاز المبيعات متصل الآن ويعمل بشكل طبيعي</p>
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">منذ 5 دقائق</div>
                  </div>

                  <div
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg border border-blue-200 dark:border-blue-800 animate-slide-in-right"
                    style={{ animationDelay: "0.1s" }}
                  >
                    <div className="bg-blue-500 p-3 rounded-full shadow-md">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-lg">تم إرسال رسائل جماعية</p>
                      <p className="text-muted-foreground">تم إرسال 25 رسالة بنجاح إلى العملاء</p>
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">منذ 15 دقيقة</div>
                  </div>

                  <div
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg border border-purple-200 dark:border-purple-800 animate-slide-in-right"
                    style={{ animationDelay: "0.2s" }}
                  >
                    <div className="bg-purple-500 p-3 rounded-full shadow-md">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-lg">تسجيل دخول جديد</p>
                      <p className="text-muted-foreground">قام المدير بتسجيل الدخول للنظام</p>
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">منذ 30 دقيقة</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
