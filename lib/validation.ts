import { z } from "zod"

// تعريف المخططات
export const LoginSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
})

export const CreateDeviceSchema = z.object({
  name: z.string().min(1, "اسم الجهاز مطلوب").max(100, "اسم الجهاز طويل جداً"),
})

export const SendMessageSchema = z.object({
  recipient: z.string().min(1, "رقم المستقبل مطلوب"),
  message: z.string().min(1, "نص الرسالة مطلوب").max(1000, "الرسالة طويلة جداً"),
})

export const SendBulkMessageSchema = z.object({
  recipients: z.array(z.string()).min(1, "يجب إدخال رقم واحد على الأقل"),
  message: z.string().min(1, "نص الرسالة مطلوب").max(1000, "الرسالة طويلة جداً"),
})

export const ContactSchema = z.object({
  name: z.string().min(1, "اسم جهة الاتصال مطلوب"),
  phoneNumber: z.string().min(1, "رقم الهاتف مطلوب"),
})

// تصدير إضافي للتوافق مع الكود القديم
export const loginSchema = LoginSchema

// دوال التحقق
export const ValidationSchemas = {
  createDevice: (data: any) => {
    try {
      return CreateDeviceSchema.parse(data)
    } catch (error) {
      console.error("Device validation error:", error)
      return null
    }
  },

  sendMessage: (data: any) => {
    try {
      return SendMessageSchema.parse(data)
    } catch (error) {
      console.error("Message validation error:", error)
      return null
    }
  },

  sendBulkMessage: (data: any) => {
    try {
      return SendBulkMessageSchema.parse(data)
    } catch (error) {
      console.error("Bulk message validation error:", error)
      return null
    }
  },

  contact: (data: any) => {
    try {
      return ContactSchema.parse(data)
    } catch (error) {
      console.error("Contact validation error:", error)
      return null
    }
  },

  login: (data: any) => {
    try {
      return LoginSchema.parse(data)
    } catch (error) {
      console.error("Login validation error:", error)
      return null
    }
  },
}
