"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2, Eye, EyeOff } from "lucide-react"
import { logger } from "@/lib/logger"

// This component is only meant for development testing of the login API.
// When NODE_ENV is set to "production" it will render nothing so it isn't
// included in the UI.
export default function LoginTest() {
  const [credentials, setCredentials] = useState({
    username: "admin",
    password: "admin123!@#",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: any
  } | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  if (process.env.NODE_ENV === "production") {
    return null
  }

  const testLogin = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: "تسجيل الدخول نجح بشكل مثالي!",
          details: {
            user: data.user,
            tokenExists: !!data.token,
            timestamp: new Date().toLocaleString("ar-SA"),
          },
        })

        // اختبار إضافي: التحقق من المصادقة
        setTimeout(async () => {
          try {
            const authResponse = await fetch("/api/auth/me")
            const authData = await authResponse.json()

            if (authResponse.ok && authData.user) {
              setResult((prev) => ({
                ...prev!,
                details: {
                  ...prev!.details,
                  authVerified: true,
                  currentUser: authData.user,
                },
              }))
            }
          } catch (error) {
            logger.error("خطأ في التحقق من المصادقة:", error as Error)
          }
        }, 1000)
      } else {
        setResult({
          success: false,
          message: data.error || "فشل في تسجيل الدخول",
          details: {
            statusCode: response.status,
            timestamp: new Date().toLocaleString("ar-SA"),
          },
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: "خطأ في الاتصال بالخادم",
        details: {
          error: (error as Error).message,
          timestamp: new Date().toLocaleString("ar-SA"),
        },
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      })

      if (response.ok) {
        setResult({
          success: true,
          message: "تسجيل الخروج نجح",
          details: {
            timestamp: new Date().toLocaleString("ar-SA"),
          },
        })
      }
    } catch (error) {
      logger.error("خطأ في تسجيل الخروج:", error as Error)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          اختبار تسجيل الدخول
        </CardTitle>
        <CardDescription>اختبر نظام المصادقة باستخدام البيانات الافتراضية</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">اسم المستخدم</Label>
          <Input
            id="username"
            value={credentials.username}
            onChange={(e) => setCredentials((prev) => ({ ...prev, username: e.target.value }))}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">كلمة المرور</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={credentials.password}
              onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))}
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={testLogin} disabled={isLoading} className="flex-1">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جاري الاختبار...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                اختبار الدخول
              </>
            )}
          </Button>
          <Button onClick={testLogout} variant="outline" disabled={isLoading}>
            تسجيل الخروج
          </Button>
        </div>

        {result && (
          <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <Badge variant={result.success ? "default" : "destructive"}>{result.success ? "نجح" : "فشل"}</Badge>
            </div>
            <AlertDescription className="mt-2">
              <p className="font-medium">{result.message}</p>
              {result.details && (
                <div className="mt-2 text-xs space-y-1">
                  {Object.entries(result.details).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-mono">{key}:</span>
                      <span className="font-mono">{JSON.stringify(value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>
            <strong>ملاحظة:</strong> هذه هي البيانات الافتراضية للنظام
          </p>
          <p>يُنصح بتغيير كلمة المرور بعد أول تسجيل دخول</p>
        </div>
      </CardContent>
    </Card>
  )
}
