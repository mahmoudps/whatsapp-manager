import Database from "better-sqlite3"
import { logger } from "./logger"
import path from "path"
import fs from "fs"
import bcrypt from "bcryptjs"

const DB_PATH = process.env.DATABASE_PATH || "./data/whatsapp_manager.db"

interface Admin {
  id: number
  username: string
  passwordHash: string
  isActive: boolean
  loginAttempts: number
  lockedUntil?: string
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

interface Device {
  id: number
  name: string
  status: string
  phoneNumber?: string
  qrCode?: string
  lastSeen?: string
  errorMessage?: string
  connectionAttempts: number
  createdAt: string
  updatedAt: string
}

interface Message {
  id: number
  deviceId: number
  recipient: string
  message: string
  status: string
  messageId?: string
  messageType: string
  sentAt?: string
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

interface IncomingMessage {
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

interface Contact {
  id: number
  name: string
  phoneNumber: string
  createdAt: string
  updatedAt: string
}

class DatabaseManager {
  private db: Database.Database | null = null
  private initialized = false

  constructor() {}

  async init(): Promise<Database.Database | null> {
    try {
      // التأكد من وجود مجلد البيانات
      const dbDir = path.dirname(DB_PATH)
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true })
      }

      logger.info("🔄 Initializing production database...")

      // فتح اتصال قاعدة البيانات مع إعدادات الإنتاج
      this.db = new Database(DB_PATH)

      // تمكين WAL mode للأداء الأفضل
      this.db.exec("PRAGMA journal_mode=WAL;")
      this.db.exec("PRAGMA synchronous=NORMAL;")
      this.db.exec("PRAGMA cache_size=1000;")
      this.db.exec("PRAGMA foreign_keys=ON;")

      // إنشاء الجداول
      await this.createTables()

      // إنشاء المسؤول الافتراضي
      await this.createDefaultAdmin()

      this.initialized = true
      logger.info("✅ Production database initialized successfully at:", DB_PATH)

      return this.db
    } catch (error) {
      logger.error("❌ Database initialization error:", error)
      throw error
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    try {
      // جدول المديرين
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS admins (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT DEFAULT 'admin',
          is_active INTEGER DEFAULT 1,
          login_attempts INTEGER DEFAULT 0,
          locked_until TEXT,
          last_login TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
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

      // إنشاء فهارس للأداء
      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_devices_status ON devices (status)`)
      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_device_id ON messages (device_id)`)
      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_status ON messages (status)`)
      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_incoming_messages_device_id ON incoming_messages (device_id)`)
      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts (phone_number)`)

      logger.info("✅ Database tables created successfully")
    } catch (error) {
      logger.error("❌ Error creating tables:", error)
      throw error
    }
  }

  private async createDefaultAdmin(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    try {
      const username = process.env.ADMIN_USERNAME || "admin"
      const password = process.env.ADMIN_PASSWORD || "admin123"

      // التحقق من وجود المدير
      const existingAdmin = this.db.prepare("SELECT id FROM admins WHERE username = ?").get(username)
      
      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(password, 12)
        
        this.db.prepare(`
          INSERT INTO admins (username, password_hash) 
          VALUES (?, ?)
        `).run(username, hashedPassword)

        logger.info(`✅ Default admin user created: ${username}`)
      } else {
        logger.info(`ℹ️ Admin user already exists: ${username}`)
      }
    } catch (error) {
      logger.error("❌ Error creating default admin:", error)
      throw error
    }
  }

  // Admin operations
  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    if (!this.db) throw new Error("Database not initialized")
    
    const admin = this.db.prepare(`
      SELECT id, username, password_hash as passwordHash, is_active as isActive,
             login_attempts as loginAttempts, locked_until as lockedUntil,
             last_login as lastLogin, created_at as createdAt, updated_at as updatedAt
      FROM admins WHERE username = ?
    `).get(username) as Admin | undefined

    return admin
  }

  async getAdminById(id: string | number): Promise<Admin | undefined> {
    if (!this.db) throw new Error("Database not initialized")

    const admin = this.db.prepare(`
      SELECT id, username, role, is_active as isActive, last_login as lastLogin,
             created_at as createdAt, updated_at as updatedAt
      FROM admins WHERE id = ?
    `).get(id) as Admin | undefined

    return admin
  }

  async updateAdmin(id: number, data: Partial<Admin>): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    const fields = []
    const values = []

    if (data.passwordHash) {
      fields.push("password_hash = ?")
      values.push(data.passwordHash)
    }
    if (data.loginAttempts !== undefined) {
      fields.push("login_attempts = ?")
      values.push(data.loginAttempts)
    }
    if (data.lockedUntil !== undefined) {
      fields.push("locked_until = ?")
      values.push(data.lockedUntil)
    }
    if (data.lastLogin) {
      fields.push("last_login = ?")
      values.push(data.lastLogin)
    }

    fields.push("updated_at = CURRENT_TIMESTAMP")
    values.push(id)

    this.db.prepare(`
      UPDATE admins SET ${fields.join(", ")} WHERE id = ?
    `).run(...values)
  }

  // Device operations
  async getAllDevices(): Promise<Device[]> {
    if (!this.db) throw new Error("Database not initialized")

    const devices = this.db.prepare(`
      SELECT id, name, status, phone_number as phoneNumber, qr_code as qrCode,
             last_seen as lastSeen, error_message as errorMessage,
             connection_attempts as connectionAttempts,
             created_at as createdAt, updated_at as updatedAt
      FROM devices ORDER BY created_at DESC
    `).all() as Device[]

    return devices
  }

  async createDevice(name: string): Promise<Device> {
    if (!this.db) throw new Error("Database not initialized")

    const result = this.db.prepare(`
      INSERT INTO devices (name) VALUES (?)
    `).run(name)

    const device = this.db.prepare(`
      SELECT id, name, status, phone_number as phoneNumber, qr_code as qrCode,
             last_seen as lastSeen, error_message as errorMessage,
             connection_attempts as connectionAttempts,
             created_at as createdAt, updated_at as updatedAt
      FROM devices WHERE id = ?
    `).get(result.lastInsertRowid) as Device

    return device
  }

  async updateDevice(id: number, data: Partial<Device>): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    const fields = []
    const values = []

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

    fields.push("updated_at = CURRENT_TIMESTAMP")
    values.push(id)

    this.db.prepare(`
      UPDATE devices SET ${fields.join(", ")} WHERE id = ?
    `).run(...values)
  }

  async deleteDevice(id: number): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    this.db.prepare("DELETE FROM devices WHERE id = ?").run(id)
  }

  async getDeviceById(id: number): Promise<Device | undefined> {
    if (!this.db) throw new Error("Database not initialized")

    const device = this.db.prepare(`
      SELECT id, name, status, phone_number as phoneNumber, qr_code as qrCode,
             last_seen as lastSeen, error_message as errorMessage,
             connection_attempts as connectionAttempts,
             created_at as createdAt, updated_at as updatedAt
      FROM devices WHERE id = ?
    `).get(id) as Device | undefined

    return device
  }

  // Message operations
  async createMessage(data: Omit<Message, "id" | "createdAt" | "updatedAt">): Promise<Message> {
    if (!this.db) throw new Error("Database not initialized")

    const result = this.db.prepare(`
      INSERT INTO messages (device_id, recipient, message, status, message_id, message_type, sent_at, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.deviceId,
      data.recipient,
      data.message,
      data.status,
      data.messageId || null,
      data.messageType,
      data.sentAt || null,
      data.errorMessage || null
    )

    const message = this.db.prepare(`
      SELECT id, device_id as deviceId, recipient, message, status,
             message_id as messageId, message_type as messageType,
             sent_at as sentAt, error_message as errorMessage,
             created_at as createdAt, updated_at as updatedAt
      FROM messages WHERE id = ?
    `).get(result.lastInsertRowid) as Message

    return message
  }

  async getAllMessages(limit = 100, offset = 0): Promise<Message[]> {
    if (!this.db) throw new Error("Database not initialized")

    const messages = this.db.prepare(`
      SELECT id, device_id as deviceId, recipient, message, status,
             message_id as messageId, message_type as messageType,
             sent_at as sentAt, error_message as errorMessage,
             created_at as createdAt, updated_at as updatedAt
      FROM messages 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(limit, offset) as Message[]

    return messages
  }

  async getMessagesByDevice(deviceId: number, limit = 100): Promise<Message[]> {
    if (!this.db) throw new Error("Database not initialized")

    const messages = this.db.prepare(`
      SELECT id, device_id as deviceId, recipient, message, status,
             message_id as messageId, message_type as messageType,
             sent_at as sentAt, error_message as errorMessage,
             created_at as createdAt, updated_at as updatedAt
      FROM messages 
      WHERE device_id = ?
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(deviceId, limit) as Message[]

    return messages
  }

  async updateMessage(id: number, data: Partial<Message>): Promise<void> {
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

    this.db.prepare(`
      UPDATE messages SET ${fields.join(", ")} WHERE id = ?
    `).run(...values)
  }

  // Incoming message operations
  async createIncomingMessage(data: Omit<IncomingMessage, "id" | "createdAt">): Promise<IncomingMessage> {
    if (!this.db) throw new Error("Database not initialized")

    const result = this.db.prepare(`
      INSERT INTO incoming_messages (device_id, sender, message, message_id, message_type, media_url, media_type, received_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.deviceId,
      data.sender,
      data.message,
      data.messageId,
      data.messageType,
      data.mediaUrl || null,
      data.mediaType || null,
      data.receivedAt
    )

    const message = this.db.prepare(`
      SELECT id, device_id as deviceId, sender, message, message_id as messageId,
             message_type as messageType, media_url as mediaUrl, media_type as mediaType,
             received_at as receivedAt, created_at as createdAt
      FROM incoming_messages WHERE id = ?
    `).get(result.lastInsertRowid) as IncomingMessage

    return message
  }

  async getIncomingMessages(deviceId?: number, limit = 100): Promise<IncomingMessage[]> {
    if (!this.db) throw new Error("Database not initialized")

    let query = `
      SELECT id, device_id as deviceId, sender, message, message_id as messageId,
             message_type as messageType, media_url as mediaUrl, media_type as mediaType,
             received_at as receivedAt, created_at as createdAt
      FROM incoming_messages
    `
    const params = []

    if (deviceId) {
      query += " WHERE device_id = ?"
      params.push(deviceId)
    }

    query += " ORDER BY received_at DESC LIMIT ?"
    params.push(limit)

    const messages = this.db.prepare(query).all(...params) as IncomingMessage[]
    return messages
  }

  // Contact operations
  async createContact(name: string, phoneNumber: string): Promise<Contact> {
    if (!this.db) throw new Error("Database not initialized")

    const result = this.db
      .prepare(
        `INSERT INTO contacts (name, phone_number) VALUES (?, ?)`,
      )
      .run(name, phoneNumber)

    const contact = this.db
      .prepare(
        `SELECT id, name, phone_number as phoneNumber, created_at as createdAt, updated_at as updatedAt FROM contacts WHERE id = ?`,
      )
      .get(result.lastInsertRowid) as Contact

    return contact
  }

  async getContact(id: number): Promise<Contact | undefined> {
    if (!this.db) throw new Error("Database not initialized")

    return this.db
      .prepare(
        `SELECT id, name, phone_number as phoneNumber, created_at as createdAt, updated_at as updatedAt FROM contacts WHERE id = ?`,
      )
      .get(id) as Contact | undefined
  }

  async listContacts(limit = 100, offset = 0): Promise<Contact[]> {
    if (!this.db) throw new Error("Database not initialized")

    return this.db
      .prepare(
        `SELECT id, name, phone_number as phoneNumber, created_at as createdAt, updated_at as updatedAt FROM contacts ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      )
      .all(limit, offset) as Contact[]
  }

  async updateContact(id: number, data: Partial<Contact>): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    const fields = []
    const values = []

    if (data.name) {
      fields.push("name = ?")
      values.push(data.name)
    }
    if (data.phoneNumber) {
      fields.push("phone_number = ?")
      values.push(data.phoneNumber)
    }

    fields.push("updated_at = CURRENT_TIMESTAMP")
    values.push(id)

    this.db
      .prepare(`UPDATE contacts SET ${fields.join(", ")} WHERE id = ?`)
      .run(...values)
  }

  async deleteContact(id: number): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    this.db.prepare(`DELETE FROM contacts WHERE id = ?`).run(id)
  }

  // Statistics
  async getStats(): Promise<any> {
    if (!this.db) throw new Error("Database not initialized")

    const totalDevices = this.db.prepare("SELECT COUNT(*) as count FROM devices").get() as { count: number }
    const connectedDevices = this.db.prepare("SELECT COUNT(*) as count FROM devices WHERE status = 'connected'").get() as { count: number }
    const totalMessages = this.db.prepare("SELECT COUNT(*) as count FROM messages").get() as { count: number }
    const sentMessages = this.db.prepare("SELECT COUNT(*) as count FROM messages WHERE status = 'sent'").get() as { count: number }

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
  return db.init()
}

// تصدير الأنواع
export type { Admin, Device, Message, IncomingMessage, Contact }
