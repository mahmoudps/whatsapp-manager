const Database = require("better-sqlite3")
const path = require("path")
const fs = require("fs")

// إنشاء مجلد البيانات إذا لم يكن موجوداً
const dataDir = path.join(__dirname, "..", "data")
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, "whatsapp_manager.db")
const db = new Database(dbPath)

console.log("🗄️ تهيئة قاعدة البيانات...")

// إنشاء الجداول
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone_number TEXT,
        status TEXT DEFAULT 'disconnected',
        qr_code TEXT,
        session_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id INTEGER,
        to_number TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        sent_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES devices (id)
    );

    CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`)

// إدراج المستخدم الافتراضي
const bcrypt = require("bcryptjs")
const defaultPassword = bcrypt.hashSync("admin123", 10)

const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (username, password) 
    VALUES (?, ?)
`)

insertUser.run("admin", defaultPassword)

console.log("✅ تم إنشاء قاعدة البيانات بنجاح")
console.log("👤 المستخدم الافتراضي: admin")
console.log("🔑 كلمة المرور الافتراضية: admin123")

db.close()
