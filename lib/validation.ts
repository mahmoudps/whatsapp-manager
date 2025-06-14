import { z } from "zod"
import { logger } from "./logger"

// Contact validation schema
const contactSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب").max(100, "الاسم طويل جداً"),
  phoneNumber: z.string().min(10, "رقم الهاتف قصير جداً").max(20, "رقم الهاتف طويل جداً"),
})

// Device validation schema
const deviceSchema = z.object({
  name: z.string().min(1, "اسم الجهاز مطلوب").max(50, "اسم الجهاز طويل جداً"),
})

// Message validation schema
const messageSchema = z.object({
  to: z.string().min(10, "رقم المستقبل مطلوب"),
  message: z.string().min(1, "الرسالة مطلوبة").max(1000, "الرسالة طويلة جداً"),
  type: z.enum(["text", "image", "document"]).optional().default("text"),
})

const mediaMessageSchema = z.object({
  recipient: z.string().min(10, "رقم المستقبل مطلوب"),
  data: z.string(),
  mimeType: z.string(),
  caption: z.string().optional().default(""),
})

const scheduledMessageSchema = z.object({
  recipient: z.string().min(10, "رقم المستقبل مطلوب"),
  message: z.string().min(1, "الرسالة مطلوبة"),
  sendAt: z.string(),
})

const contactMessageSchema = z.object({
  recipient: z.string().min(10, "رقم المستقبل مطلوب"),
  vcard: z.string().min(1, "بيانات جهة الاتصال مطلوبة"),
})

// Bulk message validation schema
const bulkMessageSchema = z.object({
  recipients: z.array(z.string()).min(1, "قائمة المستقبلين مطلوبة"),
  message: z.string().min(1, "الرسالة مطلوبة").max(1000, "الرسالة طويلة جداً"),
  delay: z.number().min(100).max(10000).optional().default(1000),
})

// User validation schema
const userSchema = z.object({
  username: z.string().min(3, "اسم المستخدم قصير جداً").max(50, "اسم المستخدم طويل جداً"),
  password: z.string().min(6, "كلمة المرور قصيرة جداً").max(100, "كلمة المرور طويلة جداً"),
})

export const ValidationSchemas = {
  contact: (data: any) => {
    try {
      return contactSchema.parse(data)
    } catch (error) {
      logger.error("Contact validation error:", error as Error)
      return null
    }
  },

  device: (data: any) => {
    try {
      return deviceSchema.parse(data)
    } catch (error) {
      logger.error("Device validation error:", error as Error)
      return null
    }
  },

  message: (data: any) => {
    try {
      return messageSchema.parse(data)
    } catch (error) {
      logger.error("Message validation error:", error as Error)
      return null
    }
  },

  mediaMessage: (data: any) => {
    try {
      return mediaMessageSchema.parse(data)
    } catch (error) {
      logger.error("Media message validation error:", error as Error)
      return null
    }
  },

  scheduledMessage: (data: any) => {
    try {
      return scheduledMessageSchema.parse(data)
    } catch (error) {
      logger.error("Scheduled message validation error:", error as Error)
      return null
    }
  },

  contactMessage: (data: any) => {
    try {
      return contactMessageSchema.parse(data)
    } catch (error) {
      logger.error("Contact message validation error:", error as Error)
      return null
    }
  },

  bulkMessage: (data: any) => {
    try {
      return bulkMessageSchema.parse(data)
    } catch (error) {
      logger.error("Bulk message validation error:", error as Error)
      return null
    }
  },

  user: (data: any) => {
    try {
      return userSchema.parse(data)
    } catch (error) {
      logger.error("User validation error:", error as Error)
      return null
    }
  },
}

// Export individual schemas for direct use
export {
  contactSchema,
  deviceSchema,
  messageSchema,
  bulkMessageSchema,
  userSchema,
  mediaMessageSchema,
  scheduledMessageSchema,
  contactMessageSchema,
}
