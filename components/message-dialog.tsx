"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Loader2, Send, Users, MessageSquare, MapPin, Contact } from "lucide-react"
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

interface BaseMessageData {
  deviceId: number
  recipient?: string
  recipients?: string[]
  message: string
  isBulk: boolean
  file?: File | null
  scheduledAt?: string
  vcard?: string
  isContact?: boolean
  latitude?: number
  longitude?: number
  isLocation?: boolean
}

interface MediaMessageData {
  deviceId: number
  formData: FormData
  isMedia: true
}

interface MessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deviceId?: number
  deviceName?: string
  devices?: Device[]
  onSendMessage: (data: BaseMessageData | MediaMessageData) => void
}

export function MessageDialog({
  open,
  onOpenChange,
  deviceId,
  deviceName,
  devices,
  onSendMessage,
}: MessageDialogProps) {
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
  const [selectedContactId, setSelectedContactId] = useState<number | undefined>()
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")

  useEffect(() => {
    if (!open || (activeTab !== "contact" && activeTab !== "contacts")) return
    ;(async () => {
      try {
        const res = await fetch("/api/contacts", { credentials: "include" })
        const data = await res.json()
        if (res.ok && data.success) {
          setContacts(data.contacts)
        }
      } catch (err) {
        logger.error("Error fetching contacts:", err as Error)
      }
    })()
  }, [open, activeTab])

  const handleSendMessage = async () => {
    if (
      (activeTab === "single" && (!recipient || (!message && !file))) ||
      (activeTab === "bulk" && (!bulkRecipients || (!message && !file))) ||
      (activeTab === "contact" && (!recipient || !vcard)) ||
      (activeTab === "location" && (!recipient || !latitude || !longitude)) ||
      (activeTab === "contacts" && (!selectedContactId || !message))
    ) {
      return
    }

    setIsSending(true)

    try {
      const targetDeviceId = selectedDeviceId ?? deviceId
      if (!targetDeviceId) throw new Error("deviceId is required")

      if (activeTab === "single") {
        if (file) {
          const fd = new FormData()
          fd.append("recipient", recipient)
          fd.append("caption", message)
          fd.append("file", file)
          await onSendMessage({ deviceId: targetDeviceId, formData: fd, isMedia: true })
        } else {
          await onSendMessage({
            deviceId: targetDeviceId,
            recipient,
            message,
            isBulk: false,
            scheduledAt,
          })
        }
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
      } else if (activeTab === "contact") {
        await onSendMessage({
          deviceId: targetDeviceId,
          recipient,
          message: "",
          isBulk: false,
          vcard,
          isContact: true,
        })
      } else if (activeTab === "location") {
        await onSendMessage({
          deviceId: targetDeviceId,
          recipient,
          message,
          isBulk: false,
          latitude: Number(latitude),
          longitude: Number(longitude),
          isLocation: true,
        })
      } else if (activeTab === "contacts") {
        const contact = contacts.find((c) => c.id === selectedContactId)
        if (!contact) throw new Error("contact not found")
        if (file) {
          const fd = new FormData()
          fd.append("recipient", contact.phoneNumber)
          fd.append("caption", message)
          fd.append("file", file)
          await onSendMessage({ deviceId: targetDeviceId, formData: fd, isMedia: true })
        } else {
          await onSendMessage({
            deviceId: targetDeviceId,
            recipient: contact.phoneNumber,
            message,
            isBulk: false,
            scheduledAt,
          })
        }
      }

      setRecipient("")
      setBulkRecipients("")
      setMessage("")
      setVcard("")
      setSelectedContactId(undefined)
      setFile(null)
      setScheduledAt("")
      setLatitude("")
      setLongitude("")
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
                  <SelectItem key={d.id} value={d.id.toString()}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
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
            <TabsTrigger value="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              إرسال موقع
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
              <p className="text-xs text-gray-500">أدخل كل رقم في سطر منفصل بالصغة الدولية (مثال: 966501234567)</p>
            </div>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="contactSelect">اختر جهة الاتصال</Label>
              <Select value={selectedContactId?.toString()} onValueChange={(val) => setSelectedContactId(Number(val))}>
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

          <TabsContent value="location" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="locRecipient">رقم المستلم</Label>
              <Input
                id="locRecipient"
                placeholder="أدخل رقم الهاتف كاملاً (مثال: 966501234567)"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="latitude">خط العرض</Label>
              <Input
                id="latitude"
                type="number"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">خط الطول</Label>
              <Input
                id="longitude"
                type="number"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
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
              <Select
                value={selectedContactId?.toString()}
                onValueChange={(val) => {
                  const id = Number(val)
                  setSelectedContactId(id)
                  const c = contacts.find((ct) => ct.id === id)
                  if (c) {
                    const vc = `BEGIN:VCARD\nVERSION:3.0\nFN:${c.name}\nTEL;type=CELL;type=VOICE;waid=${c.phoneNumber}:${c.phoneNumber}\nEND:VCARD`
                    setVcard(vc)
                  }
                }}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="اختر جهة الاتصال" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
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
              (activeTab === "single" && (!recipient || (!message && !file))) ||
              (activeTab === "bulk" && (!bulkRecipients || (!message && !file))) ||
              (activeTab === "contact" && (!recipient || !vcard)) ||
              (activeTab === "location" && (!recipient || !latitude || !longitude)) ||
              (activeTab === "contacts" && (!selectedContactId || !message))
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
