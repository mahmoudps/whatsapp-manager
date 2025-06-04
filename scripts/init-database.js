#!/usr/bin/env node

/**
 * سكريبت تهيئة قاعدة البيانات لـ WhatsApp Manager
 */

require("dotenv").config()
const sqlite3 = require("sqlite3").verbose()
const bcrypt = require("bcryptjs")
const fs = require("fs")
const path = require("path")

const dbPath = process.env.DATABASE_PATH || "./data/whatsapp_manager.db"

// التأكد من وجود المجلد
const dbDir = path.dirname(dbPath)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const db = new sqlite3.Database(dbPath)

async function initDatabase() {
  console.log("🗄️ بدء تهيئة قاعدة البيانات...")

  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        // إنشاء جدول المستخدمين
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `)

        // إنشاء جدول الأجهزة
        db.run(`
          CREATE TABLE IF NOT EXISTS devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            phone TEXT,
            status TEXT DEFAULT 'disconnected',
            qr_code TEXT,
            last_connected TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `)

        // إنشاء جدول الرسائل
        db.run(`
          CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id INTEGER NOT NULL,
            message_id TEXT,
            chat_id TEXT,
            from_me BOOLEAN,
            from_number TEXT,
            to_number TEXT,
            message TEXT,
            media_url TEXT,
            media_type TEXT,
            status TEXT,
            timestamp TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
          )
        `)

        // إنشاء جدول الإشعارات
        db.run(`
          CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id INTEGER,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
          )
        `)

        console.log("✅ تم إنشاء الجداول بنجاح")

        // إنشاء المستخدم الافتراضي
        const adminUsername = process.env.ADMIN_USERNAME || "admin"
        const adminPassword = process.env.ADMIN_PASSWORD || "admin123"

        // التحقق من وجود المستخدم
        db.get("SELECT id FROM users WHERE username = ?", [adminUsername], async (err, row) => {
          if (err) {
            reject(err)
            return
          }

          if (!row) {
            const hashedPassword = await bcrypt.hash(adminPassword, 10)
            
            db.run(
              "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
              [adminUsername, hashedPassword, "admin"],
              (err) => {
                if (err) {
                  reject(err)
                  return
                }
                console.log(`✅ تم إنشاء المستخدم الافتراضي: ${adminUsername}`)
                resolve()
              }
            )
          } else {
            console.log("✅ المستخدم الافتراضي موجود بالفعل")
            resolve()
          }
        })

      } catch (error) {
        reject(error)
      }
    })
  })
}

initDatabase()
  .then(() => {
    console.log("🎉 تم إعداد قاعدة البيانات بنجاح!")
    db.close()
  })
  .catch((error) => {
    console.error("❌ خطأ في تهيئة قاعدة البيانات:", error.message)
    db.close()
    process.exit(1)
  })
