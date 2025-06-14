"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MainLayout } from "@/components/layout/main-layout"
import { RefreshCw, Plus, Loader2, Pencil, Trash2 } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { logger } from "@/lib/logger"
import type { Contact } from "@/lib/database"

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [form, setForm] = useState({ name: "", phoneNumber: "" })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { actions } = useApp()

  const fetchContacts = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/contacts")
      const data = await res.json()
      if (data.success) {
        setContacts(data.contacts || data.data || [])
      } else {
        throw new Error(data.error || "فشل في جلب جهات الاتصال")
      }
    } catch (err) {
      logger.error("Error fetching contacts", err as Error)
      actions.addNotification({
        type: "error",
        title: "خطأ",
        message: "فشل في جلب جهات الاتصال",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [])

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phoneNumber.trim()) {
      return
    }
    try {
      setIsSubmitting(true)
      const url = editingId ? `/api/contacts/${editingId}` : "/api/contacts"
      const method = editingId ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل العملية")
      }
      actions.addNotification({
        type: "success",
        title: "نجاح",
        message: editingId ? "تم التحديث" : "تمت الإضافة",
      })
      setForm({ name: "", phoneNumber: "" })
      setEditingId(null)
      fetchContacts()
    } catch (err) {
      logger.error("Error saving contact", err as Error)
      actions.addNotification({
        type: "error",
        title: "خطأ",
        message: (err as Error).message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (contact: Contact) => {
    setEditingId(contact.id)
    setForm({ name: contact.name, phoneNumber: contact.phoneNumber })
  }

  const handleDelete = async (id: number) => {
    if (!confirm("تأكيد الحذف؟")) return
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل الحذف")
      }
      actions.addNotification({ type: "success", title: "نجاح", message: "تم الحذف" })
      fetchContacts()
    } catch (err) {
      logger.error("Delete contact", err as Error)
      actions.addNotification({ type: "error", title: "خطأ", message: "فشل الحذف" })
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">إدارة جهات الاتصال</h1>
            <p className="text-gray-600 dark:text-gray-400">أضف وجهات اتصالك وقم بإدارتها</p>
          </div>
          <Button onClick={fetchContacts} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            تحديث
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {editingId ? "تعديل جهة اتصال" : "إضافة جهة اتصال"}
            </CardTitle>
            <CardDescription>أدخل بيانات جهة الاتصال</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="الاسم"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={isSubmitting}
            />
            <Input
              placeholder="رقم الهاتف كاملاً"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              disabled={isSubmitting}
              dir="ltr"
            />
            <div className="flex gap-2">
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => {
                    setEditingId(null)
                    setForm({ name: "", phoneNumber: "" })
                  }}
                >
                  إلغاء
                </Button>
              )}
              <Button onClick={handleSubmit} disabled={isSubmitting || !form.name || !form.phoneNumber}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {editingId ? "حفظ" : "إضافة"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {isLoading ? (
            <p>جاري التحميل...</p>
          ) : contacts.length === 0 ? (
            <p className="text-center text-gray-500">لا توجد جهات اتصال</p>
          ) : (
            contacts.map((contact) => (
              <Card key={contact.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-sm text-gray-500" dir="ltr">{contact.phoneNumber}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(contact)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(contact.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  )
}
