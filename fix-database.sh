#!/bin/bash

# تعيين الألوان
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔧 إصلاح قاعدة البيانات لـ WhatsApp Manager...${NC}"

# التأكد من وجود المجلد
cd /opt/whatsapp-manager || {
  echo -e "${RED}❌ مجلد التطبيق غير موجود${NC}"
  exit 1
}

# إنشاء مجلد البيانات إذا لم يكن موجودًا
mkdir -p data

# إيقاف الحاويات
echo -e "${YELLOW}⏳ إيقاف الحاويات...${NC}"
docker-compose down

# إنشاء سكريبت تهيئة قاعدة البيانات
echo -e "${YELLOW}⏳ إنشاء سكريبت تهيئة قاعدة البيانات...${NC}"
cat > init-db.js << 'EOF'
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// تكوين المسارات
const DB_PATH = process.env.DATABASE_PATH || './data/whatsapp_manager.db';
const DB_DIR = path.dirname(DB_PATH);

// التأكد من وجود المجلد
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
  console.log(`تم إنشاء المجلد: ${DB_DIR}`);
}

// إنشاء اتصال قاعدة البيانات
console.log(`إنشاء قاعدة البيانات في: ${DB_PATH}`);
const db = new Database(DB_PATH);

// تمكين WAL mode للأداء الأفضل
db.exec('PRAGMA journal_mode=WAL;');
db.exec('PRAGMA synchronous=NORMAL;');
db.exec('PRAGMA cache_size=1000;');
db.exec('PRAGMA foreign_keys=ON;');

// إنشاء الجداول
console.log('إنشاء الجداول...');

// جدول المستخدمين
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_login TEXT
  )
`);

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
    last_connection_attempt TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// جدول جهات الاتصال
db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone_number TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

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
`);

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
`);

// جدول تحليلات الاستخدام
db.exec(`
  CREATE TABLE IF NOT EXISTS analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    device_id INTEGER,
    message_id TEXT,
    data TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  )
`);

// جدول رموز التحديث
db.exec(`
  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    revoked INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

// إنشاء فهارس للأداء
db.exec(`CREATE INDEX IF NOT EXISTS idx_devices_status ON devices (status)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_device_id ON messages (device_id)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_status ON messages (status)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_incoming_messages_device_id ON incoming_messages (device_id)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics (event_type)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts (phone_number)`);

// إنشاء المستخدم الافتراضي
console.log('إنشاء المستخدم الافتراضي...');
const username = process.env.ADMIN_USERNAME || 'admin';
const password = process.env.ADMIN_PASSWORD || 'admin123';

// التحقق من وجود المستخدم
const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);

if (!existingUser) {
  const hashedPassword = bcrypt.hashSync(password, 12);
  db.prepare(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`)
    .run(username, hashedPassword, 'admin');
  console.log(`تم إنشاء المستخدم الافتراضي: ${username}`);
} else {
  console.log(`المستخدم ${username} موجود بالفعل`);
}

// إغلاق قاعدة البيانات
db.close();
console.log('تم إنشاء قاعدة البيانات بنجاح!');
EOF

# تثبيت التبعيات اللازمة
echo -e "${YELLOW}⏳ تثبيت التبعيات اللازمة...${NC}"
npm install --save better-sqlite3 bcryptjs

# تنفيذ سكريبت تهيئة قاعدة البيانات
echo -e "${YELLOW}⏳ تهيئة قاعدة البيانات...${NC}"
node init-db.js

# إعادة تشغيل الحاويات
echo -e "${YELLOW}⏳ إعادة تشغيل الحاويات...${NC}"
docker-compose up -d

echo -e "${GREEN}✅ تم إصلاح قاعدة البيانات بنجاح!${NC}"
echo -e "${YELLOW}📋 للتحقق من الحالة: wa-manager status${NC}"
echo -e "${YELLOW}📋 لعرض السجلات: wa-manager logs${NC}"
