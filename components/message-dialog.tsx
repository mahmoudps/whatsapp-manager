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
import type { Contact as StoredContact } from "@/lib/database"

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
    vcard?: string
    isContact?: boolean
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
  const [vcard, setVcard] = useState("")
  const [contacts, setContacts] = useState<StoredContact[]>([])
  const [selectedContactId, setSelectedContactId] = useState<string>()

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await fetch("/api/contacts", { credentials: "include" })
        const data = await res.json()
        if (res.ok && data.success) {
          setContacts(data.contacts)
        }
      } catch (err) {
        logger.error("Error fetching contacts:", err as Error)
      }
    }
    if (open && activeTab === "contact" && contacts.length === 0) {
      void fetchContacts()
    }
  }, [open, activeTab])

  const handleSendMessage = async () => {
    if (activeTab === "single" && (!recipient || !message)) {
      return
    }

    if (activeTab === "bulk" && (!bulkRecipients || !message)) {
      return
    }

    if (activeTab === "contact" && (!recipient || !vcard)) {
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
        await onSendMessage({
          deviceId: targetDeviceId,
          recipient,
          message: "",
          isBulk: false,
          vcard,
          isContact: true,
        })
      }

      // إعادة تعيين النموذج
      setRecipient("")
      setBulkRecipients("")
      setMessage("")
      setVcard("")
      setSelectedContactId(undefined)
      setFile(null)
      setScheduledAt("")
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
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <Contact className="h-4 w-4" />
              إرسال جهة اتصال
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

          <TabsContent value="contact" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="recipientContact">رقم المستلم</Label>
              <Input
                id="recipientContact"
                placeholder="أدخل رقم الهاتف كاملاً"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>اختر جهة الاتصال</Label>
              <Select value={selectedContactId} onValueChange={(val) => {
                setSelectedContactId(val)
                const c = contacts.find((ct) => ct.id.toString() === val)
                if (c) {
                  const vc = `BEGIN:VCARD\nVERSION:3.0\nFN:${c.name}\nTEL;type=CELL;type=VOICE;waid=${c.phoneNumber}:${c.phoneNumber}\nEND:VCARD`
                  setVcard(vc)
                }
              }}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="اختر جهة الاتصال" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vcard">بيانات vCard</Label>
              <Textarea
                id="vcard"
                value={vcard}
                onChange={(e) => setVcard(e.target.value)}
                rows={5}
              />
            </div>
          </TabsContent>

          {activeTab !== "contact" && (
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
          )}
          </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            إلغاء
          </Button>
          <Button
            onClick={handleSendMessage}
            disabled={
              isSending ||
              (activeTab === "contact"
                ? !recipient || !vcard
                : activeTab === "single"
                  ? !recipient || (!file && !message)
                  : !bulkRecipients || (!file && !message))
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
