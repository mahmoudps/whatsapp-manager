const Database = require("better-sqlite3")
const bcrypt = require("bcryptjs")
const path = require("path")
const fs = require("fs")

const DB_PATH = process.env.DATABASE_PATH || "./data/whatsapp_manager.db"
const DATA_DIR = path.dirname(DB_PATH)

console.log("🔄 Fixing database structure...")

// إنشاء مجلد البيانات إذا لم يكن موجوداً
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  console.log(`✅ Created data directory: ${DATA_DIR}`)
}

// حذف قاعدة البيانات القديمة إذا كانت معطوبة
if (fs.existsSync(DB_PATH)) {
  console.log("🗑️  Removing old corrupted database...")
  fs.unlinkSync(DB_PATH)
}

// إنشاء قاعدة البيانات الجديدة
const db = new Database(DB_PATH)

console.log("✅ Connected to new SQLite database")

// تمكين WAL mode للأداء الأفضل
db.exec("PRAGMA journal_mode=WAL;")
db.exec("PRAGMA synchronous=NORMAL;")
db.exec("PRAGMA cache_size=1000;")
db.exec("PRAGMA foreign_keys=ON;")

// إنشاء الجداول بالهيكل الصحيح
const createTables = () => {
  try {
    // جدول المديرين
    db.exec(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        isActive INTEGER DEFAULT 1,
        loginAttempts INTEGER DEFAULT 0,
        lockedUntil TEXT,
        lastLogin TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `)
    console.log("✅ Admins table created")

    // جدول الأجهزة
    db.exec(`
      CREATE TABLE IF NOT EXISTS devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'disconnected',
        phoneNumber TEXT,
        qrCode TEXT,
        lastSeen TEXT,
        errorMessage TEXT,
        connectionAttempts INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `)
    console.log("✅ Devices table created")

    // جدول الرسائل الصادرة
    db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        deviceId INTEGER NOT NULL,
        recipient TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        messageId TEXT,
        messageType TEXT DEFAULT 'text',
        sentAt TEXT,
        errorMessage TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (deviceId) REFERENCES devices (id) ON DELETE CASCADE
      )
    `)
    console.log("✅ Messages table created")

    // جدول الرسائل الواردة
    db.exec(`
      CREATE TABLE IF NOT EXISTS incoming_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        deviceId INTEGER NOT NULL,
        sender TEXT NOT NULL,
        message TEXT NOT NULL,
        messageId TEXT UNIQUE NOT NULL,
        messageType TEXT DEFAULT 'text',
        mediaUrl TEXT,
        mediaType TEXT,
        receivedAt TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (deviceId) REFERENCES devices (id) ON DELETE CASCADE
      )
    `)
    console.log("✅ Incoming messages table created")

    // إنشاء الفهارس للأداء
    db.exec("CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status)")
    db.exec("CREATE INDEX IF NOT EXISTS idx_messages_device_status ON messages(deviceId, status)")
    db.exec("CREATE INDEX IF NOT EXISTS idx_incoming_device_received ON incoming_messages(deviceId, receivedAt)")
    db.exec("CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(createdAt)")
    console.log("✅ Database indexes created")
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
    const now = new Date().toISOString()

    const stmt = db.prepare(
      `INSERT OR IGNORE INTO admins (username, passwordHash, isActive, createdAt, updatedAt) VALUES (?, ?, 1, ?, ?)`,
    )
    const result = stmt.run(username, hashedPassword, now, now)

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
const fixDatabase = async () => {
  try {
    console.log("🚀 Fixing database structure...")
    createTables()
    await createDefaultAdmin()
    console.log("✅ Database structure fixed successfully!")

    db.close()
    console.log("✅ Database connection closed")
  } catch (error) {
    console.error("❌ Database fix failed:", error)
    process.exit(1)
  }
}

fixDatabase()
