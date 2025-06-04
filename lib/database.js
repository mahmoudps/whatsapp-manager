const Database = require("better-sqlite3");
const { logger } = require("./simple-logger");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");

const DB_PATH = process.env.DATABASE_PATH || "./data/whatsapp_manager.db";

class DatabaseManager {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  async init() {
    try {
      // التأكد من وجود مجلد البيانات
      const dbDir = path.dirname(DB_PATH);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      logger.info("🔄 Initializing production database...");

      // فتح اتصال قاعدة البيانات مع إعدادات الإنتاج
      this.db = new Database(DB_PATH);

      // تمكين WAL mode للأداء الأفضل
      this.db.exec("PRAGMA journal_mode=WAL;");
      this.db.exec("PRAGMA synchronous=NORMAL;");
      this.db.exec("PRAGMA cache_size=1000;");
      this.db.exec("PRAGMA foreign_keys=ON;");

      // إنشاء الجداول
      await this.createTables();

      // إنشاء المسؤول الافتراضي
      await this.createDefaultAdmin();

      this.initialized = true;
      logger.info("✅ Production database initialized successfully at: " + DB_PATH);

      return this.db;
    } catch (error) {
      logger.error("❌ Database initialization error: " + error.message);
      throw error;
    }
  }

  async createTables() {
    if (!this.db) throw new Error("Database not initialized");

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
      `);

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
      `);

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
      `);

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
      `);

      // إنشاء فهارس للأداء
      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_devices_status ON devices (status)`);
      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_device_id ON messages (device_id)`);
      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_status ON messages (status)`);
      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_incoming_messages_device_id ON incoming_messages (device_id)`);

      logger.info("✅ Database tables created successfully");
    } catch (error) {
      logger.error("❌ Error creating tables: " + error.message);
      throw error;
    }
  }

  async createDefaultAdmin() {
    if (!this.db) throw new Error("Database not initialized");

    try {
      const username = process.env.ADMIN_USERNAME || "admin";
      const password = process.env.ADMIN_PASSWORD || "admin123";

      // التحقق من وجود المدير
      const existingAdmin = this.db.prepare("SELECT id FROM admins WHERE username = ?").get(username);
      
      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(password, 12);
        
        this.db.prepare(`
          INSERT INTO admins (username, password_hash) 
          VALUES (?, ?)
        `).run(username, hashedPassword);

        logger.info(`✅ Default admin user created: ${username}`);
      } else {
        logger.info(`ℹ️ Admin user already exists: ${username}`);
      }
    } catch (error) {
      logger.error("❌ Error creating default admin: " + error.message);
      throw error;
    }
  }

  // الدوال الأخرى...
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
}

// إنشاء instance واحد من DatabaseManager
const db = new DatabaseManager();

// Explicit initialization function
async function initializeDatabase() {
  return db.init();
}

module.exports = { db, initializeDatabase };
