"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react"

interface TestResult {
  name: string
  status: "success" | "error" | "warning" | "loading"
  message: string
  details?: string
}

export default function TestPage() {
  const [tests, setTests] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const updateTest = (name: string, status: TestResult["status"], message: string, details?: string) => {
    setTests((prev) => {
      const existing = prev.find((t) => t.name === name)
      if (existing) {
        existing.status = status
        existing.message = message
        existing.details = details
        return [...prev]
      }
      return [...prev, { name, status, message, details }]
    })
  }

  const runTests = async () => {
    setIsRunning(true)
    setTests([])

    // اختبار 1: التحقق من متغيرات البيئة
    updateTest("Environment Variables", "loading", "فحص متغيرات البيئة...")
    try {
      const envVars = {
        NEXT_PUBLIC_WHATSAPP_API_URL: process.env.NEXT_PUBLIC_WHATSAPP_API_URL,
        NODE_ENV: process.env.NODE_ENV,
      }

      if (envVars.NEXT_PUBLIC_WHATSAPP_API_URL) {
        updateTest(
          "Environment Variables",
          "success",
          "متغيرات البيئة متوفرة",
          `API URL: ${envVars.NEXT_PUBLIC_WHATSAPP_API_URL}`,
        )
      } else {
        updateTest("Environment Variables", "error", "متغيرات البيئة مفقودة")
      }
    } catch (error) {
      updateTest("Environment Variables", "error", "خطأ في فحص متغيرات البيئة")
    }

    // اختبار 2: التحقق من API Health
    updateTest("API Health", "loading", "فحص حالة API...")
    try {
      const response = await fetch("/api/health")
      const data = await response.json()

      if (response.ok && data.status === "ok") {
        updateTest("API Health", "success", "API يعمل بشكل طبيعي", `Database: ${data.database}`)
      } else {
        updateTest("API Health", "error", "API لا يعمل بشكل صحيح")
      }
    } catch (error) {
      updateTest("API Health", "error", "فشل في الاتصال بـ API", error.message)
    }

    // اختبار 3: اختبار تسجيل الدخول
    updateTest("Login Test", "loading", "اختبار تسجيل الدخول...")
    try {
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "admin",
          password: "admin123!@#",
        }),
      })

      const loginData = await loginResponse.json()

      if (loginResponse.ok && loginData.success) {
        updateTest("Login Test", "success", "تسجيل الدخول نجح", `المستخدم: ${loginData.user?.username}`)

        // اختبار 4: التحقق من المصادقة
        updateTest("Auth Verification", "loading", "التحقق من المصادقة...")
        const authResponse = await fetch("/api/auth/me")
        const authData = await authResponse.json()

        if (authResponse.ok && authData.user) {
          updateTest(
            "Auth Verification",
            "success",
            "المصادقة تعمل بشكل صحيح",
            `المستخدم المصادق: ${authData.user.username}`,
          )
        } else {
          updateTest("Auth Verification", "error", "فشل في التحقق من المصادقة")
        }
      } else {
        updateTest("Login Test", "error", "فشل في تسجيل الدخول", loginData.error || "خطأ غير معروف")
      }
    } catch (error) {
      updateTest("Login Test", "error", "خطأ في اختبار تسجيل الدخول", error.message)
    }

    // اختبار 5: اختبار قاعدة البيانات
    updateTest("Database Test", "loading", "اختبار قاعدة البيانات...")
    try {
      const dbResponse = await fetch("/api/devices")
      const dbData = await dbResponse.json()

      if (dbResponse.ok) {
        updateTest(
          "Database Test",
          "success",
          "قاعدة البيانات تعمل بشكل طبيعي",
          `عدد الأجهزة: ${dbData.devices?.length || 0}`,
        )
      } else {
        updateTest("Database Test", "error", "مشكلة في قاعدة البيانات")
      }
    } catch (error) {
      updateTest("Database Test", "error", "فشل في اختبار قاعدة البيانات", error.message)
    }

    setIsRunning(false)
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case "loading":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
    }
  }

  const getStatusColor = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800"
      case "error":
        return "bg-red-100 text-red-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "loading":
        return "bg-blue-100 text-blue-800"
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6" />
            اختبار النظام
          </CardTitle>
          <CardDescription>اختبار جميع مكونات النظام للتأكد من عملها بشكل صحيح</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <Button onClick={runTests} disabled={isRunning} className="flex items-center gap-2">
              {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              {isRunning ? "جاري الاختبار..." : "بدء الاختبار"}
            </Button>
          </div>

          {tests.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">نتائج الاختبار</h3>
              <div className="space-y-3">
                {tests.map((test, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                    {getStatusIcon(test.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{test.name}</span>
                        <Badge className={getStatusColor(test.status)}>{test.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{test.message}</p>
                      {test.details && <p className="text-xs text-gray-500 font-mono">{test.details}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">بيانات تسجيل الدخول الافتراضية:</h4>
            <div className="space-y-1 text-sm font-mono">
              <p>
                <strong>اسم المستخدم:</strong> admin
              </p>
              <p>
                <strong>كلمة المرور:</strong> admin123!@#
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold mb-2 text-blue-800">خطوات الاختبار اليدوي:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
              <li>انتقل إلى صفحة تسجيل الدخول (/login)</li>
              <li>أدخل البيانات الافتراضية</li>
              <li>تأكد من إعادة التوجيه إلى الصفحة الرئيسية</li>
              <li>تحقق من ظهور اسم المستخدم في الهيدر</li>
              <li>جرب تسجيل الخروج والدخول مرة أخرى</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
