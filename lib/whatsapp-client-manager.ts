import { Client, LocalAuth } from "whatsapp-web.js"
import QRCode from "qrcode"
import { db, initializeDatabase } from "./database"
import { logger } from "./logger"
import path from "path"
import fs from "fs"
import { EventEmitter } from "events"

// التأكد من وجود مجلد الجلسات
const SESSION_DIR = path.join(process.cwd(), "data", "whatsapp_sessions")
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true })
}

interface WhatsAppClient {
  id: number
  client: Client
  status: "disconnected" | "connecting" | "qr_ready" | "connected" | "error"
  qrCode?: string
  phoneNumber?: string
  lastActivity: Date
  messageQueue: Array<{
    id: string
    recipient: string
    message: string
    retries: number
  }>
}

interface IncomingMessage {
  deviceId: number
  sender: string
  message: string
  messageId: string
  messageType: string
  mediaUrl?: string
  receivedAt: string
}

class WhatsAppClientManager extends EventEmitter {
  private clients: Map<number, WhatsAppClient> = new Map()
  private messageProcessingInterval: NodeJS.Timeout | null = null
  private healthCheckInterval: NodeJS.Timeout | null = null

  constructor() {
    super()
  }

  async init(): Promise<void> {
    await initializeDatabase()
    await this.initializeExistingDevices()
    this.startMessageProcessor()
    this.startHealthCheck()
  }

  // تنظيف الجلسات المعطلة - محسن للإنتاج
  private async cleanupSessions(deviceId: number): Promise<void> {
    try {
      const sessionPath = path.join(SESSION_DIR, `session-device_${deviceId}`)

      // إيقاف العمليات المرتبطة بهذا الجهاز
      const { exec } = require("child_process")
      await new Promise<void>((resolve) => {
        exec(`pkill -f "device_${deviceId}"`, (error) => {
          if (error && error.message && !error.message.includes("No such process")) {
            logger.warn(`Warning killing processes for device ${deviceId}:`, error.message)
          }
          resolve()
        })
      })

      // حذف ملفات القفل
      if (fs.existsSync(sessionPath)) {
        const lockFiles = ["SingletonLock", ".lock", "chrome_debug.log"]
        for (const lockFile of lockFiles) {
          const lockPath = path.join(sessionPath, lockFile)
          if (fs.existsSync(lockPath)) {
            try {
              fs.unlinkSync(lockPath)
              logger.info(`Removed ${lockFile} for device ${deviceId}`)
            } catch (error) {
              logger.warn(`Could not remove ${lockFile}:`, error)
            }
          }
        }
      }

      // انتظار للتأكد من التنظيف
      await new Promise((resolve) => setTimeout(resolve, 2000))

      logger.info(`Session cleanup completed for device ${deviceId}`)
    } catch (error) {
      logger.error(`Error cleaning up sessions for device ${deviceId}:`, error)
    }
  }

  // تهيئة الأجهزة الموجودة في قاعدة البيانات
  private async initializeExistingDevices(): Promise<void> {
    try {
      const devices = await db.getAllDevices()
      logger.info(`Initializing ${devices.length} existing devices`)

      for (const device of devices) {
        await this.cleanupSessions(device.id)

        // إعادة تعيين حالة الأجهزة المعلقة
        if (device.status !== "disconnected") {
          await db.updateDevice(device.id, {
            status: "disconnected",
            qrCode: undefined,
            errorMessage: "System restart - please reconnect",
            lastSeen: new Date().toISOString(),
          })
        }
      }

      logger.info("All existing devices initialized and cleaned")
    } catch (error) {
      logger.error("Error initializing existing devices:", error)
    }
  }

  // إنشاء عميل WhatsApp حقيقي للإنتاج
  async createClient(deviceId: number, deviceName: string): Promise<boolean> {
    try {
      logger.info(`Creating production WhatsApp client for device ${deviceId}: ${deviceName}`)

      // تنظيف الجلسة السابقة
      await this.cleanupSessions(deviceId)

      // إزالة العميل السابق إن وجد
      const existingClient = this.clients.get(deviceId)
      if (existingClient) {
        try {
          await existingClient.client.destroy()
        } catch (error) {
          logger.warn(`Error destroying existing client for device ${deviceId}:`, error)
        }
        this.clients.delete(deviceId)
      }

      // تحديث حالة الجهاز
      await db.updateDevice(deviceId, {
        status: "connecting",
        qrCode: undefined,
        errorMessage: undefined,
        lastSeen: new Date().toISOString(),
      })

      // تكوين عميل WhatsApp مع إعدادات الإنتاج
      const client = new Client({
        authStrategy: new LocalAuth({
          clientId: `device_${deviceId}`,
          dataPath: SESSION_DIR,
        }),
        puppeteer: {
          headless: true,
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium-browser",
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--single-process",
            "--disable-gpu",
            "--disable-web-security",
            "--disable-features=VizDisplayCompositor",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
            "--disable-field-trial-config",
            "--disable-back-forward-cache",
            "--disable-ipc-flooding-protection",
            "--disable-extensions",
            "--disable-default-apps",
            "--disable-sync",
            "--metrics-recording-only",
            "--no-default-browser-check",
            "--disable-prompt-on-repost",
            "--disable-hang-monitor",
            "--disable-client-side-phishing-detection",
            "--disable-component-update",
            "--disable-domain-reliability",
            "--disable-features=TranslateUI",
            "--disable-translate",
            "--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            `--user-data-dir=${path.join(SESSION_DIR, `session-device_${deviceId}`)}`,
          ],
          timeout: 60000,
        },
        webVersionCache: {
          type: "remote",
          remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
        },
      })

      const whatsappClient: WhatsAppClient = {
        id: deviceId,
        client,
        status: "connecting",
        lastActivity: new Date(),
        messageQueue: [],
      }

      this.clients.set(deviceId, whatsappClient)

      // معالج QR Code
      client.on("qr", async (qr) => {
        try {
          logger.info(`QR Code generated for device ${deviceId}`)
          const qrCodeDataURL = await QRCode.toDataURL(qr, {
            width: 300,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
            errorCorrectionLevel: "M",
          })

          whatsappClient.qrCode = qrCodeDataURL
          whatsappClient.status = "qr_ready"
          whatsappClient.lastActivity = new Date()

          await db.updateDevice(deviceId, {
            status: "qr_ready",
            qrCode: qrCodeDataURL,
            errorMessage: undefined,
            lastSeen: new Date().toISOString(),
          })

          this.emit("qr", { deviceId, qrCode: qrCodeDataURL })
          logger.info(`QR code ready for device ${deviceId}`)
        } catch (error) {
          logger.error(`Error generating QR code for device ${deviceId}`, error)
        }
      })

      // معالج الاتصال الناجح
      client.on("ready", async () => {
        try {
          logger.info(`WhatsApp client ready for device ${deviceId}`)

          const info = client.info
          whatsappClient.status = "connected"
          whatsappClient.phoneNumber = info.wid.user
          whatsappClient.lastActivity = new Date()

          await db.updateDevice(deviceId, {
            status: "connected",
            phoneNumber: info.wid.user,
            lastSeen: new Date().toISOString(),
            qrCode: undefined,
            errorMessage: undefined,
            connectionAttempts: 0,
          })

          this.emit("connected", {
            deviceId,
            phoneNumber: info.wid.user,
            deviceInfo: {
              platform: info.platform,
              pushname: info.pushname,
              wid: info.wid,
            },
          })

          logger.info(`Device ${deviceId} connected successfully with phone: ${info.wid.user}`)
        } catch (error) {
          logger.error(`Error handling ready event for device ${deviceId}:`, error)
        }
      })

      // معالج الرسائل الواردة - حقيقية من WhatsApp
      client.on("message", async (message) => {
        try {
          if (!message.fromMe) {
            whatsappClient.lastActivity = new Date()

            logger.debug(`New message received on device ${deviceId}`, {
              from: message.from,
              type: message.type,
            })

            const incomingMessage: IncomingMessage = {
              deviceId,
              sender: message.from,
              message: message.body || "",
              messageId: message.id.id,
              messageType: message.type,
              mediaUrl: message.hasMedia ? "has_media" : undefined,
              receivedAt: new Date().toISOString(),
            }

            // حفظ في قاعدة البيانات
            await db.createIncomingMessage(incomingMessage)

            // إرسال عبر WebSocket
            this.emit("message", { deviceId, message: incomingMessage })

            // معالجة الوسائط إذا وجدت
            if (message.hasMedia) {
              try {
                const media = await message.downloadMedia()
                if (media && media.data) {
                  const mediaDir = path.join(process.cwd(), "data", "media")
                  if (!fs.existsSync(mediaDir)) {
                    fs.mkdirSync(mediaDir, { recursive: true })
                  }

                  // التحقق من نوع الملف المسموح
                  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4", "audio/mpeg"]
                  if (allowedTypes.includes(media.mimetype)) {
                    const fileName = `${message.id.id}_${Date.now()}.${media.mimetype.split("/")[1]}`
                    const filePath = path.join(mediaDir, fileName)

                    fs.writeFileSync(filePath, media.data, "base64")

                    await db.updateIncomingMessage(message.id.id, {
                      mediaUrl: `/media/${fileName}`,
                      mediaType: media.mimetype,
                    })

                    logger.info(`Media saved successfully`, { fileName, type: media.mimetype })
                  } else {
                    logger.warn(`Unsupported media type: ${media.mimetype}`)
                  }
                }
              } catch (mediaError) {
                logger.error(`Error processing media for message ${message.id.id}`, mediaError)
              }
            }
          }
        } catch (error) {
          logger.error(`Error handling incoming message for device ${deviceId}`, error)
        }
      })

      // معالج قطع الاتصال
      client.on("disconnected", async (reason) => {
        try {
          logger.warn(`WhatsApp client disconnected for device ${deviceId}: ${reason}`)

          whatsappClient.status = "disconnected"

          await db.updateDevice(deviceId, {
            status: "disconnected",
            lastSeen: new Date().toISOString(),
            errorMessage: `Disconnected: ${reason}`,
          })

          this.emit("disconnected", { deviceId, reason })

          // تنظيف العميل من الذاكرة
          this.clients.delete(deviceId)
          await this.cleanupSessions(deviceId)

          logger.info(`Device ${deviceId} disconnected and cleaned up`)
        } catch (error) {
          logger.error(`Error handling disconnect for device ${deviceId}:`, error)
        }
      })

      // معالج فشل المصادقة
      client.on("auth_failure", async (message) => {
        try {
          logger.error(`Authentication failed for device ${deviceId}: ${message}`)

          whatsappClient.status = "error"

          await db.updateDevice(deviceId, {
            status: "error",
            errorMessage: `Auth failure: ${message}`,
            lastSeen: new Date().toISOString(),
          })

          this.emit("error", { deviceId, error: message })
          await this.cleanupSessions(deviceId)
        } catch (error) {
          logger.error(`Error handling auth failure for device ${deviceId}:`, error)
        }
      })

      // معالج الأخطاء العامة
      client.on("error", async (error) => {
        try {
          logger.error(`Client error for device ${deviceId}:`, error)

          whatsappClient.status = "error"

          await db.updateDevice(deviceId, {
            status: "error",
            errorMessage: error.message || "Unknown client error",
            lastSeen: new Date().toISOString(),
          })

          this.emit("error", { deviceId, error: error.message })
        } catch (err) {
          logger.error(`Error handling client error for device ${deviceId}:`, err)
        }
      })

      // بدء تهيئة العميل
      logger.info(`Initializing WhatsApp client for device ${deviceId}`)
      await client.initialize()

      return true
    } catch (error) {
      logger.error(`Error creating WhatsApp client for device ${deviceId}:`, error)

      await db.updateDevice(deviceId, {
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        lastSeen: new Date().toISOString(),
      })
      this.clients.delete(deviceId) // Ensure client is removed on init failure

      await this.cleanupSessions(deviceId)
      return false
    }
  }

  // إرسال رسالة حقيقية
  async sendMessage(deviceId: number, recipient: string, message: string): Promise<boolean> {
    try {
      const whatsappClient = this.clients.get(deviceId)

      if (!whatsappClient || whatsappClient.status !== "connected") {
        throw new Error(`Device ${deviceId} not connected. Status: ${whatsappClient?.status || "not found"}`)
      }

      // التحقق من صحة رقم الهاتف
      if (!this.isValidPhoneNumber(recipient)) {
        throw new Error("Invalid phone number format")
      }

      // تنسيق رقم الهاتف
      const formattedNumber = this.formatPhoneNumber(recipient)

      logger.info(`Sending message from device ${deviceId} to ${formattedNumber}`)

      // إرسال الرسالة الحقيقية
      const sentMessage = await whatsappClient.client.sendMessage(formattedNumber, message)

      whatsappClient.lastActivity = new Date()

      // حفظ الرسالة في قاعدة البيانات
      const messageRecord = await db.createMessage({
        deviceId,
        recipient: formattedNumber,
        message,
        status: "sent",
        sentAt: new Date().toISOString(),
        messageType: "text",
        messageId: sentMessage.id.id,
      })

      logger.info(`Message sent successfully from device ${deviceId} to ${formattedNumber}`)

      this.emit("message_sent", {
        deviceId,
        recipient: formattedNumber,
        message,
        messageId: sentMessage.id.id,
        timestamp: new Date().toISOString(),
      })

      return true
    } catch (error) {
      logger.error(`Error sending message from device ${deviceId}:`, error)

      // حفظ الرسالة الفاشلة
      await db.createMessage({
        deviceId,
        recipient,
        message,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        messageType: "text",
      })

      this.emit("message_failed", {
        deviceId,
        recipient,
        message,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })

      return false
    }
  }

  // إرسال رسائل متعددة مع تحكم في السرعة
  async sendBulkMessages(
    deviceId: number,
    recipients: string[],
    message: string,
    delayBetweenMessages = 3000,
  ): Promise<Array<{ recipient: string; success: boolean; error?: string }>> {
    const results = []
    const whatsappClient = this.clients.get(deviceId)

    if (!whatsappClient || whatsappClient.status !== "connected") {
      throw new Error(`Device ${deviceId} not connected`)
    }

    logger.info(`Starting bulk message send for device ${deviceId} to ${recipients.length} recipients`)

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i]

      try {
        const success = await this.sendMessage(deviceId, recipient, message)
        results.push({
          recipient,
          success,
          error: success ? undefined : "Failed to send",
        })

        // تأخير بين الرسائل لتجنب الحظر
        if (i < recipients.length - 1 && delayBetweenMessages > 0) {
          logger.info(`Waiting ${delayBetweenMessages}ms before sending next message`)
          await new Promise((resolve) => setTimeout(resolve, delayBetweenMessages))
        }
      } catch (error) {
        results.push({
          recipient,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    logger.info(
      `Bulk message send completed for device ${deviceId}. Success: ${results.filter((r) => r.success).length}/${recipients.length}`,
    )
    return results
  }

  // معالج طوابير الرسائل
  private startMessageProcessor(): void {
    this.messageProcessingInterval = setInterval(async () => {
      for (const [deviceId, client] of this.clients) {
        if (client.status === "connected" && client.messageQueue.length > 0) {
          const message = client.messageQueue.shift()
          if (message) {
            try {
              await this.sendMessage(deviceId, message.recipient, message.message)
            } catch (error) {
              logger.error(`Error processing queued message for device ${deviceId}:`, error)

              // إعادة إضافة الرسالة إلى الطابور إذا لم تتجاوز عدد المحاولات
              if (message.retries < 3) {
                message.retries++
                client.messageQueue.push(message)
              }
            }
          }
        }
      }
    }, 5000) // فحص كل 5 ثواني
  }

  // مراقب صحة الاتصالات
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      const now = new Date()

      for (const [deviceId, client] of this.clients) {
        // فحص النشاط الأخير
        const inactiveTime = now.getTime() - client.lastActivity.getTime()
        const fiveMinutes = 5 * 60 * 1000

        if (client.status === "connected" && inactiveTime > fiveMinutes) {
          try {
            // اختبار الاتصال عبر إرسال ping
            const state = await client.client.getState()
            if (state !== "CONNECTED") {
              logger.warn(`Device ${deviceId} state changed to ${state}, updating status`)
              await this.updateDeviceStatus(deviceId, "disconnected")
            } else {
              client.lastActivity = now
            }
          } catch (error: any) {
            logger.warn(`Health check failed for device ${deviceId}:`, error)
            await this.updateDeviceStatus(deviceId, "error")
          }
        }
      }
    }, 60000) // فحص كل دقيقة
  }

  // تحديث حالة الجهاز
  private async updateDeviceStatus(deviceId: number, status: string): Promise<void> {
    const client = this.clients.get(deviceId)
    if (client) {
      client.status = status as any
      await db.updateDevice(deviceId, {
        status,
        lastSeen: new Date().toISOString(),
      })
      this.emit("status_changed", { deviceId, status })
    }
  }

  // قطع اتصال جهاز
  async disconnectDevice(deviceId: number): Promise<boolean> {
    try {
      logger.info(`Disconnecting device ${deviceId}`)

      const whatsappClient = this.clients.get(deviceId)

      if (whatsappClient) {
        await whatsappClient.client.destroy()
        this.clients.delete(deviceId)
      }

      await db.updateDevice(deviceId, {
        status: "disconnected",
        lastSeen: new Date().toISOString(),
      })

      await this.cleanupSessions(deviceId)

      logger.info(`Device ${deviceId} disconnected successfully`)
      return true
    } catch (error) {
      logger.error(`Error disconnecting device ${deviceId}:`, error)
      return false
    }
  }

  // الحصول على حالة جهاز
  getDeviceStatus(deviceId: number): string {
    const client = this.clients.get(deviceId)
    return client ? client.status : "disconnected"
  }

  // الحصول على QR Code
  getDeviceQR(deviceId: number): string | undefined {
    const client = this.clients.get(deviceId)
    return client?.qrCode
  }

  // التحقق من اتصال الجهاز
  isClientReady(deviceId: number): boolean {
    const client = this.clients.get(deviceId)
    return client?.status === "connected"
  }

  // تنسيق رقم الهاتف للإنتاج
  private formatPhoneNumber(phoneNumber: string): string {
    // إزالة جميع الرموز غير الرقمية
    let cleaned = phoneNumber.replace(/\D/g, "")

    // معالجة الأرقام الدولية
    if (phoneNumber.startsWith("+")) {
      cleaned = phoneNumber.substring(1).replace(/\D/g, "")
    }

    // معالجة الأرقام التي تبدأ بـ 00
    if (cleaned.startsWith("00")) {
      cleaned = cleaned.substring(2)
    }

    // معالجة الأرقام السعودية المحلية
    if (cleaned.startsWith("0") && cleaned.length === 10) {
      cleaned = "966" + cleaned.substring(1)
    }

    // التحقق من طول الرقم
    if (cleaned.length < 10 || cleaned.length > 15) {
      throw new Error("Invalid phone number length")
    }

    return cleaned + "@c.us"
  }

  // التحقق من صحة رقم الهاتف
  private isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^[+]?[0-9\-\s()]{8,15}$/
    return phoneRegex.test(phone.trim())
  }

  // إحصائيات النظام
  getStats() {
    const stats = {
      totalClients: this.clients.size,
      connected: 0,
      connecting: 0,
      qr_ready: 0,
      error: 0,
      disconnected: 0,
      totalMessageQueue: 0,
    }

    this.clients.forEach((client) => {
      if (client.status in stats) {
        stats[client.status as keyof typeof stats]++
      }
      stats.totalMessageQueue += client.messageQueue.length
    })

    return stats
  }

  // تنظيف شامل للنظام
  async cleanup(): Promise<void> {
    try {
      logger.info("Starting comprehensive system cleanup...")

      // إيقاف المراقبين
      if (this.messageProcessingInterval) {
        clearInterval(this.messageProcessingInterval)
      }
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval)
      }

      // إيقاف جميع العملاء
      const disconnectPromises = Array.from(this.clients.keys()).map((deviceId) => this.disconnectDevice(deviceId))

      await Promise.allSettled(disconnectPromises)

      this.clients.clear()

      // تنظيف العمليات المعلقة
      const { exec } = require("child_process")
      exec('pkill -f "chrome.*whatsapp"', () => {})
      exec('pkill -f "chromium.*whatsapp"', () => {})

      logger.info("System cleanup completed successfully")
    } catch (error) {
      logger.error("Error during system cleanup:", error)
    }
  }
}

// إنشاء مثيل واحد من المدير
export const whatsappManager = new WhatsAppClientManager()
// Initialize manager and database before allowing usage
try {
  await whatsappManager.init()
} catch (error) {
  logger.error("Error initializing WhatsAppClientManager:", error)
}

// تنظيف عند إغلاق التطبيق
process.on("SIGTERM", () => whatsappManager.cleanup())
process.on("SIGINT", () => whatsappManager.cleanup())
process.on("SIGUSR2", () => whatsappManager.cleanup()) // Nodemon restart

export default whatsappManager
