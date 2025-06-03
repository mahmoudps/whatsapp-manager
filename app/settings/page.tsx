"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { User, Lock, Save, Loader2, Eye, EyeOff, Shield, Database, Server, Info } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { MainLayout } from "@/components/layout/main-layout"

interface UserType {
  id: number
  username: string
  lastLogin?: string
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const { actions } = useApp()

  useEffect(() => {
    fetchUserInfo()
  }, [])

  const fetchUserInfo = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        throw new Error("فشل في جلب معلومات المستخدم")
      }
    } catch (err) {
      actions.addNotification({ type: "error", title: "خطأ", message: (err as Error).message })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      actions.addNotification({ type: "warning", title: "تنبيه", message: "يرجى ملء جميع الحقول" })
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      actions.addNotification({ type: "error", title: "خطأ", message: "كلمة المرور الجديدة وتأكيدها غير متطابقين" })
      return
    }

    if (passwordForm.newPassword.length < 8) {
      actions.addNotification({ type: "error", title: "خطأ", message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" })
      return
    }

    // التحقق من قوة كلمة المرور
    const hasUpperCase = /[A-Z]/.test(passwordForm.newPassword)
    const hasLowerCase = /[a-z]/.test(passwordForm.newPassword)
    const hasNumbers = /\d/.test(passwordForm.newPassword)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.newPassword)

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      actions.addNotification({
        type: "error",
        title: "خطأ",
        message: "كلمة المرور يجب أن تحتوي على أحرف كبيرة وصغيرة وأرقام ورموز خاصة",
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      const data = await response.json()

      if (data.success) {
        actions.addNotification({ type: "success", title: "نجاح", message: "تم تغيير كلمة المرور بنجاح" })
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      } else {
        throw new Error(data.error || "فشل في تغيير كلمة المرور")
      }
    } catch (err) {
      actions.addNotification({ type: "error", title: "خطأ", message: (err as Error).message })
    } finally {
      setIsSaving(false)
    }
  }

  const getPasswordStrength = (password: string) => {
    let score = 0
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    Object.values(checks).forEach((check) => check && score++)

    if (score < 3) return { level: "ضعيف", color: "text-red-500", bg: "bg-red-100" }
    if (score < 5) return { level: "متوسط", color: "text-yellow-500", bg: "bg-yellow-100" }
    return { level: "قوي", color: "text-green-500", bg: "bg-green-100" }
  }

  const passwordStrength = passwordForm.newPassword ? getPasswordStrength(passwordForm.newPassword) : null

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">الإعدادات</h1>
          <p className="text-gray-600 dark:text-gray-400">إدارة إعدادات الحساب والنظام</p>
        </div>

        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              معلومات المستخدم
            </CardTitle>
            <CardDescription>معلومات الحساب الحالي</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>اسم المستخدم</Label>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">{user.username}</div>
                </div>
                <div>
                  <Label>آخر تسجيل دخول</Label>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString("ar-SA") : "غير متوفر"}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              تغيير كلمة المرور
            </CardTitle>
            <CardDescription>قم بتحديث كلمة المرور لحسابك</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                <div className="relative mt-1">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="أدخل كلمة المرور الحالية"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                <div className="relative mt-1">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="أدخل كلمة المرور الجديدة"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {passwordStrength && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">قوة كلمة المرور:</span>
                      <Badge className={`${passwordStrength.bg} ${passwordStrength.color} border-0`}>
                        {passwordStrength.level}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</Label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="أعد إدخال كلمة المرور الجديدة"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">متطلبات كلمة المرور:</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• 8 أحرف على الأقل</li>
                  <li>• حرف كبير واحد على الأقل (A-Z)</li>
                  <li>• حرف صغير واحد على الأقل (a-z)</li>
                  <li>• رقم واحد على الأقل (0-9)</li>
                  <li>• رمز خاص واحد على الأقل (!@#$%^&*)</li>
                </ul>
              </div>

              <Button onClick={handlePasswordChange} disabled={isSaving} className="w-full">
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                حفظ كلمة المرور الجديدة
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              معلومات النظام
            </CardTitle>
            <CardDescription>معلومات حول النظام والإصدار</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">إصدار النظام</span>
                  </div>
                  <Badge variant="outline">v8.0.0</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-green-500" />
                    <span className="font-medium">قاعدة البيانات</span>
                  </div>
                  <Badge variant="default">SQLite</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">الأمان</span>
                  </div>
                  <Badge variant="default">SSL/TLS</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">حالة النظام</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    النظام يعمل بشكل طبيعي وجميع الخدمات متاحة
                  </p>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">آخر تحديث</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">{new Date().toLocaleDateString("ar-SA")}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
