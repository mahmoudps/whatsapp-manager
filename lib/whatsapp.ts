import { Client, LocalAuth } from "whatsapp-web.js"
import QRCode from "qrcode"
import { db } from "./database"
import { logger } from "./logger"

export class WhatsAppManager {
  private static instance: WhatsAppManager
  private clients: Map<number, Client> = new Map()
  private clientStatus: Map<number, string> = new Map()

  static getInstance(): WhatsAppManager {
    if (!WhatsAppManager.instance) {
      WhatsAppManager.instance = new WhatsAppManager()
    }
    return WhatsAppManager.instance
  }

  async createClient(deviceId: number): Promise<void> {
    logger.info(
      `Attempting to create client for device ${deviceId}. Current status: ${this.clientStatus.get(deviceId)}`,
    )
    const deviceData = db.getDevice(deviceId)
    if (!deviceData) {
      logger.error(`Device ${deviceId} not found in database. Cannot create client.`)
      db.updateDevice(deviceId, { status: "error", error_message: "Device not found in DB" }) // أو إنشاء سجل خطأ إذا لم يكن موجودًا
      return
    }

    const maxAttempts = Number.parseInt(process.env.MAX_AUTH_ATTEMPTS || "5", 10)
    if (
      deviceData.connection_attempts >= maxAttempts &&
      (deviceData.status === "auth_failed" || deviceData.status === "error")
    ) {
      logger.warn(
        `Device ${deviceId} has reached max connection attempts (${deviceData.connection_attempts}). Status: ${deviceData.status}. Not attempting to connect.`,
      )
      db.updateDevice(deviceId, {
        error_message: `Max connection attempts reached. Please re-authenticate or check configuration. Current attempts: ${deviceData.connection_attempts}`,
      })
      return
    }

    if (this.clients.has(deviceId)) {
      logger.info(`Destroying existing client for device ${deviceId} before creating a new one.`)
      await this.destroyClient(deviceId) // تأكد من أن destroyClient لا تحذف من قاعدة البيانات
    }

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: `device_${deviceId}`,
        dataPath: "./data/.wwebjs_auth",
      }),
      puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      },
    })

    this.clients.set(deviceId, client)
    this.clientStatus.set(deviceId, "connecting")

    try {
      db.updateDevice(deviceId, {
        status: "connecting",
        connection_attempts: (deviceData?.connection_attempts || 0) + 1,
      })
    } catch (e) {
      console.error("Error updating device status to connecting", e)
    }

    client.on("qr", async (qr) => {
      try {
        const qrCodeDataURL = await QRCode.toDataURL(qr, { width: 300 })
        this.clientStatus.set(deviceId, "qr_ready")
        db.updateDevice(deviceId, { status: "qr_ready", qr_code: qrCodeDataURL, connection_attempts: 0 }) // إعادة تعيين محاولات الاتصال
      } catch (error) {
        logger.error(`QR generation error for device ${deviceId}:`, error)
        this.clientStatus.set(deviceId, "error")
        db.updateDevice(deviceId, { status: "error", error_message: "QR generation failed" })
      }
    })

    client.on("ready", () => {
      const info = client.info
      const phoneNumber = info?.wid?.user ? `+${info.wid.user}` : info?.pushname || `Device_${deviceId}_NoNum` // التعامل مع حالة عدم وجود info.wid.user

      this.clientStatus.set(deviceId, "connected")
      db.updateDevice(deviceId, {
        status: "connected",
        phone_number: phoneNumber,
        qr_code: null,
        last_seen: new Date().toISOString(),
        error_message: null, // مسح أي خطأ سابق
        connection_attempts: 0, // إعادة تعيين محاولات الاتصال
      })
      logger.info(`Device ${deviceId} connected. Phone: ${phoneNumber || "N/A"}`)
    })

    client.on("disconnected", (reason) => {
      // reason قد يكون مفيدًا
      logger.warn(
        `Device ${deviceId} disconnected. Reason: ${reason}. Current status in DB: ${db.getDevice(deviceId)?.status}`,
      )
      this.clientStatus.set(deviceId, "disconnected")
      db.updateDevice(deviceId, { status: "disconnected", qr_code: null, error_message: `Disconnected: ${reason}` })
      // لا تحذف العميل من this.clients هنا، فقد يحاول إعادة الاتصال أو قد ترغب في إعادة استخدامه
      // this.clients.delete(deviceId); // إزالة هذا السطر إذا كنت تريد محاولة إعادة الاتصال
    })

    client.on("auth_failure", (msg) => {
      // msg يحتوي على رسالة الخطأ
      logger.error(`Authentication failure for device ${deviceId}: ${msg}`)
      this.clientStatus.set(deviceId, "auth_failed") // استخدام حالة أكثر تحديدًا
      const attempts = (deviceData.connection_attempts || 0) + 1
      db.updateDevice(deviceId, {
        status: "auth_failed",
        error_message: `Authentication failed: ${msg}. Attempts: ${attempts}`,
        connection_attempts: attempts,
      })
      // يمكنك إضافة منطق هنا لإيقاف المحاولات بعد عدد معين
      if (attempts >= maxAttempts) {
        // مثال: 5 محاولات كحد أقصى
        logger.warn(`Device ${deviceId} reached max auth attempts (${attempts}). Stopping further retries for now.`)
        // قد ترغب في تدمير العميل هنا أو وضع علامة عليه لعدم إعادة المحاولة تلقائيًا
        // this.destroyClient(deviceId);
      }
    })

    try {
      await client.initialize()
    } catch (initError) {
      logger.error(`Failed to initialize client for device ${deviceId}:`, initError)
      this.clientStatus.set(deviceId, "error")
      db.updateDevice(deviceId, {
        status: "error",
        error_message: `Initialization failed: ${(initError as Error).message}. Attempts: ${deviceData.connection_attempts + 1}`, // تحديث عدد المحاولات هنا أيضًا
        connection_attempts: deviceData.connection_attempts + 1,
      })
    }
  }

  async destroyClient(deviceId: number): Promise<void> {
    logger.info(`Attempting to destroy client for device ${deviceId}.`)
    const client = this.clients.get(deviceId)
    if (client) {
      try {
        // إضافة try-catch حول client.destroy()
        await client.destroy()
        logger.info(`Successfully destroyed client for device ${deviceId}.`)
      } catch (destroyError) {
        logger.error(`Error destroying client for device ${deviceId}:`, destroyError)
      }
      this.clients.delete(deviceId)
      this.clientStatus.delete(deviceId)
      // لا تقم بتحديث حالة قاعدة البيانات هنا بالضرورة، دع الـ route handler يقوم بذلك
    } else {
      logger.warn(`No active client instance found for device ${deviceId} to destroy.`)
    }
  }

  async sendMessage(deviceId: number, recipient: string, message: string): Promise<boolean> {
    const client = this.clients.get(deviceId)
    if (!client || this.clientStatus.get(deviceId) !== "connected") {
      throw new Error("Device not connected")
    }

    try {
      // Format phone number
      const formattedNumber = recipient.replace(/[^\d]/g, "")
      const chatId = formattedNumber.includes("@") ? formattedNumber : `${formattedNumber}@c.us`

      await client.sendMessage(chatId, message)
      return true
    } catch (error) {
      console.error("Send message error:", error)
      return false
    }
  }

  getClientStatus(deviceId: number): string {
    return this.clientStatus.get(deviceId) || "disconnected"
  }

  isClientConnected(deviceId: number): boolean {
    return this.getClientStatus(deviceId) === "connected"
  }
}

export const whatsappManager = WhatsAppManager.getInstance()
