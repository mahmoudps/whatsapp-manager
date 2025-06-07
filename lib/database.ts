import Database from "better-sqlite3"
import { logger } from "./logger"
import path from "path"
import fs from "fs"
import bcrypt from "bcryptjs"

const DB_PATH = process.env.DATABASE_PATH || "./data/whatsapp_manager.db"

export interface Device {
  id: number
  name: string
  status: "disconnected" | "connecting" | "qr_ready" | "connected" | "error" | "auth_failed"
  phoneNumber?: string
  qrCode?: string
  lastSeen?: string
  errorMessage?: string
  connectionAttempts: number
  lastConnectionAttempt?: string
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: number
  deviceId: number
  recipient: string
  message: string
  status: "pending" | "sent" | "failed"
  messageId?: string
  messageType: string
  sentAt?: string
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

export interface IncomingMessage {
  id: number
  deviceId: number
  sender: string
  message: string
  messageId: string
  messageType: string
  mediaUrl?: string
  mediaType?: string
  receivedAt: string
  createdAt: string
}

export interface AnalyticsEvent {
  id?: number
  eventType: string
  deviceId?: number
  messageId?: string
  data?: string
  details?: any
  createdAt?: string
}

export interface User {
  id: number
  username: string
  password: string
  role: string
  createdAt: string
  lastLogin?: string
}

class DatabaseManager {
  private db: Database.Database | null = null
  private initialized = false

  constructor() {
    this.init()
  }

  public async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      this.init()
    }
  }

  private init(): void {
    try {
      // التأكد من وجود مجلد البيانات
      const dbDir = path.dirname(DB_PATH)
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true })
      }

      logger.info("Initializing database...")

      // فتح اتصال قاعدة البيانات
      this.db = new Database(DB_PATH)

      // تمكين WAL mode للأداء الأفضل
      this.db.exec("PRAGMA journal_mode=WAL;")
      this.db.exec("PRAGMA synchronous=NORMAL;")
      this.db.exec("PRAGMA cache_size=1000;")
      this.db.exec("PRAGMA foreign_keys=ON;")

      // إنشاء الجداول
      this.createTables()

      // إنشاء المسؤول الافتراضي
      this.createDefaultAdmin()

      this.initialized = true
      logger.info("Database initialized successfully")
    } catch (error) {
      logger.error("Database initialization error:", error)
      throw error
    }
  }

  private createTables(): void {
    if (!this.db) throw new Error("Database not initialized")

    // جدول المستخدمين
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        last_login TEXT
      )
    `)

    // جدول الأجهزة
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'disconnected',
        phone_number TEXT,
        qr_code TEXT,
        last_seen TEXT,
        error_message TEXT,
        connection_attempts INTEGER DEFAULT 0,
        last_connection_attempt TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // جدول جهات الاتصال
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone_number TEXT UNIQUE NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // جدول الرسائل المرسلة
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id INTEGER NOT NULL,
        recipient TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        message_id TEXT,
        message_type TEXT DEFAULT 'text',
        sent_at TEXT,
        error_message TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE CASCADE
      )
    `)

    // جدول الرسائل الواردة
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS incoming_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id INTEGER NOT NULL,
        sender TEXT NOT NULL,
        message TEXT NOT NULL,
        message_id TEXT UNIQUE NOT NULL,
        message_type TEXT DEFAULT 'text',
        media_url TEXT,
        media_type TEXT,
        received_at TEXT DEFAULT CURRENT_TIMESTAMP,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE CASCADE
      )
    `)

    // جدول تحليلات الاستخدام
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        device_id INTEGER,
        message_id TEXT,
        data TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
      )
    `)

    // جدول رموز التحديث
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        revoked INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // إنشاء فهارس للأداء
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_devices_status ON devices (status)`)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_device_id ON messages (device_id)`)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_status ON messages (status)`)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_incoming_messages_device_id ON incoming_messages (device_id)`)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics (event_type)`)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts (phone_number)`)

    logger.info("Database tables created successfully")
  }

  private createDefaultAdmin(): void {
    if (!this.db) throw new Error("Database not initialized")

    try {
      const username = process.env.ADMIN_USERNAME || "admin"
      const password = process.env.ADMIN_PASSWORD || "admin123"

      // التحقق من وجود المدير
      const existingUser = this.db.prepare("SELECT id FROM users WHERE username = ?").get(username)

      if (!existingUser) {
        const hashedPassword = bcrypt.hashSync(password, 12)
        this.db
          .prepare(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`)
          .run(username, hashedPassword, "admin")
        logger.info(`Default admin user created: ${username}`)
      }
    } catch (error) {
      logger.error("Error creating default admin:", error)
    }
  }

  // Device operations
  getAllDevices(): Device[] {
    if (!this.db) throw new Error("Database not initialized")

    const devices = this.db
      .prepare(`
      SELECT id, name, status, phone_number as phoneNumber, qr_code as qrCode,
             last_seen as lastSeen, error_message as errorMessage,
             connection_attempts as connectionAttempts,
             last_connection_attempt as lastConnectionAttempt,
             created_at as createdAt, updated_at as updatedAt
      FROM devices ORDER BY created_at DESC
    `)
      .all() as Device[]

    return devices
  }

  createDevice(data: { name: string; status?: string }): Device {
    if (!this.db) throw new Error("Database not initialized")

    const result = this.db
      .prepare(`
      INSERT INTO devices (name, status) VALUES (?, ?)
    `)
      .run(data.name, data.status || "disconnected")

    const device = this.db
      .prepare(`
      SELECT id, name, status, phone_number as phoneNumber, qr_code as qrCode,
             last_seen as lastSeen, error_message as errorMessage,
             connection_attempts as connectionAttempts,
             last_connection_attempt as lastConnectionAttempt,
             created_at as createdAt, updated_at as updatedAt
      FROM devices WHERE id = ?
    `)
      .get(result.lastInsertRowid) as Device

    return device
  }

  updateDevice(id: number, data: Partial<Device>): void {
    if (!this.db) throw new Error("Database not initialized")

    const fields = []
    const values = []

    if (data.name) {
      fields.push("name = ?")
      values.push(data.name)
    }
    if (data.status) {
      fields.push("status = ?")
      values.push(data.status)
    }
    if (data.phoneNumber) {
      fields.push("phone_number = ?")
      values.push(data.phoneNumber)
    }
    if (data.qrCode !== undefined) {
      fields.push("qr_code = ?")
      values.push(data.qrCode)
    }
    if (data.lastSeen) {
      fields.push("last_seen = ?")
      values.push(data.lastSeen)
    }
    if (data.errorMessage !== undefined) {
      fields.push("error_message = ?")
      values.push(data.errorMessage)
    }
    if (data.connectionAttempts !== undefined) {
      fields.push("connection_attempts = ?")
      values.push(data.connectionAttempts)
    }
    if (data.lastConnectionAttempt) {
      fields.push("last_connection_attempt = ?")
      values.push(data.lastConnectionAttempt)
    }

    fields.push("updated_at = CURRENT_TIMESTAMP")
    values.push(id)

    this.db
      .prepare(`
      UPDATE devices SET ${fields.join(", ")} WHERE id = ?
    `)
      .run(...values)
  }

  deleteDevice(id: number): boolean {
    if (!this.db) throw new Error("Database not initialized")

    const result = this.db.prepare("DELETE FROM devices WHERE id = ?").run(id)
    return result.changes > 0
  }

  getDevice(id: number): Device | undefined {
    if (!this.db) throw new Error("Database not initialized")

    const device = this.db
      .prepare(`
      SELECT id, name, status, phone_number as phoneNumber, qr_code as qrCode,
             last_seen as lastSeen, error_message as errorMessage,
             connection_attempts as connectionAttempts,
             last_connection_attempt as lastConnectionAttempt,
             created_at as createdAt, updated_at as updatedAt
      FROM devices WHERE id = ?
    `)
      .get(id) as Device | undefined

    return device
  }

  // Message operations
  createMessage(data: Omit<Message, "id" | "createdAt" | "updatedAt">): Message {
    if (!this.db) throw new Error("Database not initialized")

    const result = this.db
      .prepare(`
      INSERT INTO messages (device_id, recipient, message, status, message_id, message_type, sent_at, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .run(
        data.deviceId,
        data.recipient,
        data.message,
        data.status,
        data.messageId || null,
        data.messageType,
        data.sentAt || null,
        data.errorMessage || null,
      )

    const message = this.db
      .prepare(`
      SELECT id, device_id as deviceId, recipient, message, status,
             message_id as messageId, message_type as messageType,
             sent_at as sentAt, error_message as errorMessage,
             created_at as createdAt, updated_at as updatedAt
      FROM messages WHERE id = ?
    `)
      .get(result.lastInsertRowid) as Message

    return message
  }

  getAllMessages(limit = 100, offset = 0): Message[] {
    if (!this.db) throw new Error("Database not initialized")

    const messages = this.db
      .prepare(`
      SELECT id, device_id as deviceId, recipient, message, status,
             message_id as messageId, message_type as messageType,
             sent_at as sentAt, error_message as errorMessage,
             created_at as createdAt, updated_at as updatedAt
      FROM messages 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `)
      .all(limit, offset) as Message[]

    return messages
  }

  getMessagesByDevice(deviceId: number, limit = 100): Message[] {
    if (!this.db) throw new Error("Database not initialized")

    const messages = this.db
      .prepare(`
      SELECT id, device_id as deviceId, recipient, message, status,
             message_id as messageId, message_type as messageType,
             sent_at as sentAt, error_message as errorMessage,
             created_at as createdAt, updated_at as updatedAt
      FROM messages 
      WHERE device_id = ?
      ORDER BY created_at DESC 
      LIMIT ?
    `)
      .all(deviceId, limit) as Message[]

    return messages
  }

  updateMessage(id: number, data: Partial<Message>): void {
    if (!this.db) throw new Error("Database not initialized")

    const fields = []
    const values = []

    if (data.status) {
      fields.push("status = ?")
      values.push(data.status)
    }
    if (data.messageId) {
      fields.push("message_id = ?")
      values.push(data.messageId)
    }
    if (data.sentAt) {
      fields.push("sent_at = ?")
      values.push(data.sentAt)
    }
    if (data.errorMessage !== undefined) {
      fields.push("error_message = ?")
      values.push(data.errorMessage)
    }

    fields.push("updated_at = CURRENT_TIMESTAMP")
    values.push(id)

    this.db
      .prepare(`
      UPDATE messages SET ${fields.join(", ")} WHERE id = ?
    `)
      .run(...values)
  }

  // Incoming message operations
  createIncomingMessage(data: Omit<IncomingMessage, "id" | "createdAt">): IncomingMessage {
    if (!this.db) throw new Error("Database not initialized")

    const result = this.db
      .prepare(`
      INSERT INTO incoming_messages (device_id, sender, message, message_id, message_type, media_url, media_type, received_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .run(
        data.deviceId,
        data.sender,
        data.message,
        data.messageId,
        data.messageType,
        data.mediaUrl || null,
        data.mediaType || null,
        data.receivedAt,
      )

    const incomingMessage = this.db
      .prepare(`
      SELECT id, device_id as deviceId, sender, message, message_id as messageId,
             message_type as messageType, media_url as mediaUrl, media_type as mediaType,
             received_at as receivedAt, created_at as createdAt
      FROM incoming_messages WHERE id = ?
    `)
      .get(result.lastInsertRowid) as IncomingMessage

    return incomingMessage
  }

  getIncomingMessages(limit = 100, offset = 0): IncomingMessage[] {
    if (!this.db) throw new Error("Database not initialized")

    const messages = this.db
      .prepare(`
      SELECT id, device_id as deviceId, sender, message, message_id as messageId,
             message_type as messageType, media_url as mediaUrl, media_type as mediaType,
             received_at as receivedAt, created_at as createdAt
      FROM incoming_messages 
      ORDER BY received_at DESC 
      LIMIT ? OFFSET ?
    `)
      .all(limit, offset) as IncomingMessage[]

    return messages
  }

  // Analytics operations
  createAnalyticsEvent(data: Omit<AnalyticsEvent, "id" | "createdAt">): void {
    if (!this.db) throw new Error("Database not initialized")

    this.db
      .prepare(`
      INSERT INTO analytics (event_type, device_id, message_id, data)
      VALUES (?, ?, ?, ?)
    `)
      .run(
        data.eventType,
        data.deviceId || null,
        data.messageId || null,
        data.details ? JSON.stringify(data.details) : null,
      )
  }

  // User operations
  getUserByUsername(username: string): User | undefined {
    if (!this.db) throw new Error("Database not initialized")

    const user = this.db
      .prepare(`
      SELECT id, username, password, role, created_at as createdAt, last_login as lastLogin
      FROM users WHERE username = ?
    `)
      .get(username) as User | undefined

    return user
  }

  updateUserLastLogin(id: number): void {
    if (!this.db) throw new Error("Database not initialized")

    this.db
      .prepare(`
      UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?
    `)
      .run(id)
  }

  // Refresh token operations
  createRefreshToken(data: { userId: number; token: string; expiresAt: string }): void {
    if (!this.db) throw new Error("Database not initialized")

    this.db
      .prepare(`INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)`)
      .run(data.userId, data.token, data.expiresAt)
  }

  getRefreshToken(token: string): any {
    if (!this.db) throw new Error("Database not initialized")

    return this.db
      .prepare(
        `SELECT id, user_id as userId, token, expires_at as expiresAt, created_at as createdAt FROM refresh_tokens WHERE token = ? AND revoked = 0`,
      )
      .get(token)
  }

  deleteRefreshToken(token: string): void {
    if (!this.db) throw new Error("Database not initialized")

    this.db.prepare(`UPDATE refresh_tokens SET revoked = 1 WHERE token = ?`).run(token)
  }

  // Statistics
  getStats(): any {
    if (!this.db) throw new Error("Database not initialized")

    const totalDevices = this.db.prepare("SELECT COUNT(*) as count FROM devices").get() as { count: number }
    const connectedDevices = this.db
      .prepare("SELECT COUNT(*) as count FROM devices WHERE status = 'connected'")
      .get() as { count: number }
    const totalMessages = this.db.prepare("SELECT COUNT(*) as count FROM messages").get() as { count: number }
    const sentMessages = this.db.prepare("SELECT COUNT(*) as count FROM messages WHERE status = 'sent'").get() as {
      count: number
    }

    return {
      totalDevices: totalDevices.count,
      connectedDevices: connectedDevices.count,
      totalMessages: totalMessages.count,
      sentMessages: sentMessages.count,
    }
  }

  // Close database connection
  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
      this.initialized = false
    }
  }
}

// إنشاء instance واحد من DatabaseManager
export const db = new DatabaseManager()

// Explicit initialization function
export async function initializeDatabase() {
  await db.ensureInitialized()
  return db
}
