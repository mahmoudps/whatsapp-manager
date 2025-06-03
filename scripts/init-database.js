const Database = require("better-sqlite3")
const bcrypt = require("bcryptjs")
const path = require("path")
const fs = require("fs")

const DB_PATH = process.env.DATABASE_PATH || "./data/whatsapp_manager.db"
const DATA_DIR = path.dirname(DB_PATH)

// إنشاء مجلد البيانات إذا لم يكن موجوداً
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  console.log(`✅ Created data directory: ${DATA_DIR}`)
}

// إنشاء قاعدة البيانات
const db = new Database(DB_PATH)
console.log("✅ Connected to SQLite database")

// إنشاء الجداول
const createTables = () => {
  try {
    // جدول المديرين
    db.exec(`
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
    console.log("✅ Admins table created/verified")

    // جدول الأجهزة
    db.exec(`
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
    console.log("✅ Devices table created/verified")

    // جدول الرسائل المرسلة
    db.exec(`
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
    console.log("✅ Messages table created/verified")

    // جدول الرسائل الواردة
    db.exec(`
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
    console.log("✅ Incoming messages table created/verified")
  } catch (error) {
    console.error("❌ Error creating tables:", error)
    throw error
  }
}

// إنشاء مستخدم admin افتراضي
const createDefaultAdmin = async () => {
  const username = process.env.ADMIN_USERNAME || "admin"
  const password = process.env.ADMIN_PASSWORD || "admin123"

  try {
    const hashedPassword = await bcrypt.hash(password, 12)

    const stmt = db.prepare(`INSERT OR IGNORE INTO admins (username, password_hash) VALUES (?, ?)`)
    const result = stmt.run(username, hashedPassword)

    if (result.changes > 0) {
      console.log(`✅ Default admin user created: ${username}`)
      console.log(`🔑 Password: ${password}`)
    } else {
      console.log(`ℹ️  Admin user already exists: ${username}`)
    }
  } catch (error) {
    console.error("❌ Error creating admin user:", error)
    throw error
  }
}

// تشغيل التهيئة
const initDatabase = async () => {
  try {
    console.log("🚀 Initializing database...")
    createTables()
    await createDefaultAdmin()
    console.log("✅ Database initialization completed successfully!")

    db.close()
    console.log("✅ Database connection closed")
  } catch (error) {
    console.error("❌ Database initialization failed:", error)
    process.exit(1)
  }
}

initDatabase()
