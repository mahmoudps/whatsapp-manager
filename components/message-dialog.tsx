"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Loader2, Send, Users, MessageSquare, Contact } from "lucide-react"
import { logger } from "@/lib/logger"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Device } from "@/lib/types"
import type { Contact as ContactType } from "@/lib/database"

interface MessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deviceId?: number
  deviceName?: string
  devices?: Device[]
  onSendMessage: (data: {
    deviceId: number
    recipient?: string
    recipients?: string[]
    message: string
    isBulk: boolean
    file?: File | null
    scheduledAt?: string
  }) => void
}

export function MessageDialog({ open, onOpenChange, deviceId, deviceName, devices, onSendMessage }: MessageDialogProps) {
  const [recipient, setRecipient] = useState("")
  const [bulkRecipients, setBulkRecipients] = useState("")
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [activeTab, setActiveTab] = useState("single")
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | undefined>(deviceId ?? devices?.[0]?.id)
  const [file, setFile] = useState<File | null>(null)
  const [scheduledAt, setScheduledAt] = useState("")
  const [contacts, setContacts] = useState<ContactType[]>([])
  const [selectedContactId, setSelectedContactId] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (!open || activeTab !== "contacts") return
    ;(async () => {
      try {
        const res = await fetch("/api/contacts")
        const data = await res.json()
        if (data.success) {
          setContacts(data.contacts || data.data || [])
        }
      } catch (err) {
        logger.error("Error fetching contacts", err as Error)
      }
    })()
  }, [open, activeTab])

  const handleSendMessage = async () => {
    if (activeTab === "single" && (!recipient || !message)) {
      return
    }

    if (activeTab === "bulk" && (!bulkRecipients || !message)) {
      return
    }

    if (activeTab === "contacts" && (!selectedContactId || !message)) {
      return
    }

    setIsSending(true)

    try {
      const targetDeviceId = selectedDeviceId ?? deviceId
      if (!targetDeviceId) {
        throw new Error("deviceId is required")
      }

      if (activeTab === "single") {
        await onSendMessage({
          deviceId: targetDeviceId,
          recipient,
          message,
          isBulk: false,
          file,
          scheduledAt,
        })
      } else if (activeTab === "bulk") {
        const recipients = bulkRecipients
          .split("\n")
          .map((r) => r.trim())
          .filter((r) => r)
        await onSendMessage({
          deviceId: targetDeviceId,
          recipients,
          message,
          isBulk: true,
          file,
          scheduledAt,
        })
      } else {
        const contact = contacts.find((c) => c.id === selectedContactId)
        if (!contact) throw new Error("contact not found")
        await onSendMessage({
          deviceId: targetDeviceId,
          recipient: contact.phoneNumber,
          message,
          isBulk: false,
          file,
          scheduledAt,
        })
      }

      // إعادة تعيين النموذج
      setRecipient("")
      setBulkRecipients("")
      setMessage("")
      setFile(null)
      setScheduledAt("")
      setSelectedContactId(undefined)
      onOpenChange(false)
    } catch (error) {
      logger.error("Error sending message:", error as Error)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {deviceName ? `إرسال رسالة عبر ${deviceName}` : "إرسال رسالة"}
          </DialogTitle>
        </DialogHeader>

        {!deviceName && devices && (
          <div className="mb-4">
            <Label>اختر الجهاز</Label>
            <Select value={selectedDeviceId?.toString()} onValueChange={(val) => setSelectedDeviceId(Number(val))}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="اختر الجهاز" />
              </SelectTrigger>
              <SelectContent>
                {devices.map((d) => (
                  <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="single" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              رسالة فردية
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              رسائل متعددة
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Contact className="h-4 w-4" />
              من جهات الاتصال
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">رقم المستلم</Label>
              <Input
                id="recipient"
                placeholder="أدخل رقم الهاتف كاملاً (مثال: 966501234567)"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                dir="ltr"
              />
              <p className="text-xs text-gray-500">
                أدخل رقم الهاتف بالصيغة الدولية بدون علامات أو مسافات (مثال: 966501234567)
              </p>
            </div>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="bulkRecipients">أرقام المستلمين</Label>
              <Textarea
                id="bulkRecipients"
                placeholder="أدخل رقم هاتف واحد في كل سطر"
                value={bulkRecipients}
                onChange={(e) => setBulkRecipients(e.target.value)}
                rows={5}
                dir="ltr"
              />
              <p className="text-xs text-gray-500">أدخل كل رقم في سطر منفصل بالصيغة الدولية (مثال: 966501234567)</p>
            </div>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="contactSelect">اختر جهة الاتصال</Label>
            <Select
              value={selectedContactId?.toString()}
              onValueChange={(val) => setSelectedContactId(Number(val))}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="اختر جهة الاتصال" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name} - {c.phoneNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

          <div className="space-y-2 mt-4">
            <Label htmlFor="message">نص الرسالة</Label>
          <Textarea
            id="message"
            placeholder="اكتب نص الرسالة هنا..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
          />
          <div className="flex justify-between">
            <p className="text-xs text-gray-500">يمكنك كتابة حتى 1000 حرف</p>
            <p className="text-xs text-gray-500">{message.length} / 1000</p>
          </div>
          <div className="space-y-2 mt-2">
            <Label htmlFor="file">مرفق (اختياري)</Label>
            <Input id="file" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <div className="space-y-2 mt-2">
            <Label htmlFor="schedule">موعد الإرسال</Label>
            <Input
              id="schedule"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
        </div>
      </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            إلغاء
          </Button>
          <Button
            onClick={handleSendMessage}
            disabled={
              isSending ||
              (!file && !message) ||
              (activeTab === "single"
                ? !recipient
                : activeTab === "bulk"
                ? !bulkRecipients
                : !selectedContactId)
            }
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                إرسال
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
