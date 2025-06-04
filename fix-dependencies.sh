#!/bin/bash

# تعيين متغيرات الألوان
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 بدء إصلاح مشاكل التبعيات...${NC}"

# إيقاف PM2
echo -e "${YELLOW}🛑 إيقاف جميع عمليات PM2...${NC}"
pm2 stop all
pm2 delete all

# إنشاء ملف logger بسيط
echo -e "${YELLOW}📝 إنشاء ملف logger بسيط...${NC}"
cat > lib/simple-logger.js << 'EOF'
/**
 * مكتبة تسجيل بسيطة تستخدم console.log بدلاً من winston
 */
const fs = require('fs');
const path = require('path');

// إنشاء مجلد السجلات إذا لم يكن موجودًا
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// تحديد مستوى التسجيل
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// دالة لكتابة السجلات في ملف
function writeToFile(level, message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${level}: ${message}\n`;
  
  // كتابة جميع السجلات في ملف combined.log
  fs.appendFileSync(path.join(logDir, 'combined.log'), logMessage);
  
  // كتابة الأخطاء في ملف error.log
  if (level === 'error') {
    fs.appendFileSync(path.join(logDir, 'error.log'), logMessage);
  }
}

// إنشاء كائن logger
const logger = {
  error: function(message) {
    if (LOG_LEVELS[LOG_LEVEL] >= LOG_LEVELS.error) {
      console.error(`ERROR: ${message}`);
      writeToFile('error', message);
    }
  },
  warn: function(message) {
    if (LOG_LEVELS[LOG_LEVEL] >= LOG_LEVELS.warn) {
      console.warn(`WARN: ${message}`);
      writeToFile('warn', message);
    }
  },
  info: function(message) {
    if (LOG_LEVELS[LOG_LEVEL] >= LOG_LEVELS.info) {
      console.info(`INFO: ${message}`);
      writeToFile('info', message);
    }
  },
  debug: function(message) {
    if (LOG_LEVELS[LOG_LEVEL] >= LOG_LEVELS.debug) {
      console.debug(`DEBUG: ${message}`);
      writeToFile('debug', message);
    }
  }
};

module.exports = { logger };
EOF

# تحديث ملف database.js
echo -e "${YELLOW}🔄 تحديث ملف database.js...${NC}"
cat > lib/database.js << 'EOF'
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
EOF

# تحديث ملف package.json
echo -e "${YELLOW}📦 تحديث ملف package.json...${NC}"
cat > package.json << 'EOF'
{
  "name": "whatsapp-manager",
  "version": "8.0.0",
  "description": "WhatsApp Manager - إدارة متقدمة لـ WhatsApp Web",
  "main": "server.js",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "node server.js",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "setup": "node scripts/setup.js",
    "init-db": "node scripts/init-database.js",
    "diagnose": "node scripts/diagnose.js",
    "fix-db": "node scripts/fix-database.js"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    "dotenv": "^16.3.1",
    "ws": "^8.14.2",
    "socket.io": "^4.7.4",
    "socket.io-client": "^4.7.4",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "better-sqlite3": "^9.2.2",
    "whatsapp-web.js": "^1.23.0",
    "puppeteer": "^21.5.2",
    "qrcode": "^1.5.3",
    "multer": "^1.4.5-lts.1",
    "cors": "^2.8.5",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "lucide-react": "^0.294.0",
    "tailwind-merge": "^2.0.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@types/node": "^20.8.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/express": "^4.17.20",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/multer": "^1.4.11",
    "@types/cors": "^2.8.17",
    "@types/ws": "^8.5.8",
    "typescript": "^5.2.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "eslint": "^8.51.0",
    "eslint-config-next": "^14.0.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.6",
    "jest-environment-jsdom": "^29.7.0"
  },
  "engines": {
    "node": ">=18.17.0",
    "npm": ">=9.0.0"
  },
  "keywords": ["whatsapp", "manager", "api", "automation", "messaging"],
  "author": "WhatsApp Manager Team",
  "license": "MIT"
}
EOF

# تثبيت التبعيات الأساسية
echo -e "${YELLOW}📦 تثبيت التبعيات الأساسية...${NC}"
npm install --no-save better-sqlite3 bcryptjs

# إنشاء ملف .env إذا لم يكن موجودًا
if [ ! -f .env ]; then
  echo -e "${YELLOW}📝 إنشاء ملف .env...${NC}"
  cat > .env << 'EOF'
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
WEBSOCKET_PORT=3001
ENABLE_WEBSOCKET=true
DATABASE_PATH=./data/whatsapp_manager.db
EOF
fi

# إنشاء المجلدات المطلوبة
echo -e "${YELLOW}📁 إنشاء المجلدات المطلوبة...${NC}"
mkdir -p data logs data/whatsapp_sessions data/media

# تشغيل التطبيق مباشرة بدون PM2
echo -e "${GREEN}🚀 تشغيل التطبيق مباشرة...${NC}"
echo -e "${BLUE}ℹ️ استخدم Ctrl+C لإيقاف التطبيق${NC}"
node server.js
