#!/bin/bash

# =============================================================================
# سكريبت شامل لتحديث وتحسين مشروع WhatsApp Manager
# يقوم بتطبيق جميع التحسينات والإصلاحات دفعة واحدة
# الإصدار: 2.0.0
# التاريخ: $(date +%Y-%m-%d)
# =============================================================================

set -e  # إيقاف السكريبت عند حدوث خطأ

# ألوان للطباعة
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly BOLD='\033[1m'
readonly NC='\033[0m' # No Color

# دوال مساعدة للطباعة
print_header() {
    echo -e "\n${BLUE}${BOLD}=== $1 ===${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

print_step() {
    echo -e "${PURPLE}➤ $1${NC}"
}

# دالة للتحقق من وجود أمر
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# دالة لإنشاء نسخة احتياطية
create_backup() {
    local file="$1"
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/$(basename "$file")"
        print_success "تم نسخ $file"
    fi
}

# دالة لإنشاء مجلد إذا لم يكن موجوداً
ensure_directory() {
    local dir="$1"
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        print_success "تم إنشاء المجلد: $dir"
    fi
}

# بداية السكريبت
main() {
    # طباعة الترحيب
    echo -e "${BOLD}${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║           🚀 WhatsApp Manager Update Script 🚀              ║"
    echo "║                                                              ║"
    echo "║  سكريبت شامل لتحديث وتحسين مشروع WhatsApp Manager          ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}\n"

    print_info "تاريخ التشغيل: $(date '+%Y-%m-%d %H:%M:%S')"
    print_info "نظام التشغيل: $(uname -s) $(uname -r)"
    print_info "المستخدم: $(whoami)"
    print_info "المجلد الحالي: $(pwd)"

    # التحقق من وجود المجلد الرئيسي للمشروع
    if [ ! -d "app" ] && [ ! -d "lib" ] && [ ! -f "package.json" ]; then
        print_error "يجب تشغيل هذا السكريبت في المجلد الرئيسي لمشروع WhatsApp Manager"
        print_info "تأكد من وجود المجلدات: app, lib وملف package.json"
        exit 1
    fi

    # التحقق من الصلاحيات
    if [ ! -w "." ]; then
        print_error "لا توجد صلاحيات كتابة في المجلد الحالي"
        exit 1
    fi

    # إنشاء نسخة احتياطية
    print_header "إنشاء نسخة احتياطية"
    
    readonly BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # نسخ الملفات المهمة
    create_backup "websocket-server.js"
    create_backup "ecosystem.config.js"
    create_backup "lib/config.js"
    create_backup "lib/auth.ts"
    create_backup "lib/database.ts"
    create_backup "package.json"
    create_backup ".env"
    create_backup "README.md"
    
    if [ -d "etc/nginx/sites-available" ]; then
        mkdir -p "$BACKUP_DIR/etc/nginx/sites-available"
        cp -r etc/nginx/sites-available/* "$BACKUP_DIR/etc/nginx/sites-available/" 2>/dev/null || true
        print_success "تم نسخ ملفات تكوين nginx"
    fi
    
    print_success "تم إنشاء نسخة احتياطية في: $BACKUP_DIR"

    # إنشاء المجلدات المطلوبة
    print_header "إنشاء المجلدات المطلوبة"
    
    ensure_directory "data"
    ensure_directory "data/whatsapp_sessions"
    ensure_directory "data/media"
    ensure_directory "logs"
    ensure_directory "scripts"
    ensure_directory "etc/nginx/sites-available"

    # تحديث websocket-server.js
    print_header "تحديث خادم WebSocket"
    print_step "إنشاء websocket-server.js محسن..."

    cat > websocket-server.js << 'EOL'
#!/usr/bin/env node

/**
 * WebSocket Server محسن لـ WhatsApp Manager
 * يدعم Socket.IO و ws مع Ubuntu 24
 * الإصدار 9.0.0 - مُحسن ومُصحح
 */

require("dotenv").config()
const { createServer } = require("http")
const { Server } = require("socket.io")
const WebSocket = require("ws")
const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const compression = require("compression")
const jwt = require("jsonwebtoken")
const path = require("path")
const fs = require("fs")

// إعدادات البيئة مع قيم افتراضية آمنة
const PORT = process.env.WEBSOCKET_PORT || 3001
const NODE_ENV = process.env.NODE_ENV || "development"
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000"
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key"
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h"

console.log("🚀 Starting WhatsApp Manager WebSocket Server v9.0.0")
console.log("🐧 Ubuntu 24.04 LTS Support: ✅")
console.log("🌐 Environment:", NODE_ENV)
console.log("📡 Port:", PORT)
console.log("🔗 Frontend URL:", FRONTEND_URL)

// التحقق من متغيرات البيئة المطلوبة
if (!process.env.JWT_SECRET) {
  console.warn("⚠️  JWT_SECRET not set, using fallback (not recommended for production)")
}

// إعداد Express
const app = express()
const server = createServer(app)

// إعدادات الأمان المحسنة
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
    hsts: NODE_ENV === "production",
  }),
)

app.use(compression())

// إعدادات CORS محسنة
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      FRONTEND_URL,
      "http://localhost:3000",
      "https://localhost:3000",
      "http://127.0.0.1:3000",
      "https://127.0.0.1:3000",
    ]

    // السماح بالطلبات بدون origin (مثل mobile apps)
    if (!origin) return callback(null, true)

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      console.warn(`CORS blocked origin: ${origin}`)
      callback(new Error("Not allowed by CORS"))
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}

app.use(cors(corsOptions))
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// إعداد Socket.IO مع دعم Ubuntu 24 المحسن
const io = new Server(server, {
  cors: corsOptions,
  transports: ["websocket", "polling"],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e8, // 100MB
})

// إعداد WebSocket Server التقليدي للتوافق
const wss = new WebSocket.Server({
  server,
  path: "/ws",
  perMessageDeflate: {
    zlibDeflateOptions: {
      level: 3,
      chunkSize: 1024,
    },
    threshold: 1024,
    concurrencyLimit: 10,
  },
})

// متغيرات النظام المحسنة
const connectedClients = new Map()
const deviceStatuses = new Map()
const systemStats = {
  startTime: new Date(),
  totalConnections: 0,
  activeConnections: 0,
  messagesProcessed: 0,
  errors: 0,
  version: "9.0.0",
  platform: process.platform,
  nodeVersion: process.version,
  memoryUsage: process.memoryUsage(),
  uptime: 0,
}

// دوال مساعدة محسنة
function generateClientId() {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function verifyToken(token) {
  try {
    if (!token) return null
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    console.warn("Token verification failed:", error.message)
    return null
  }
}

function updateSystemStats() {
  systemStats.uptime = Date.now() - systemStats.startTime.getTime()
  systemStats.memoryUsage = process.memoryUsage()
  systemStats.activeConnections = connectedClients.size
}

function broadcastToAll(event, data) {
  const message = {
    event,
    data,
    timestamp: new Date().toISOString(),
    serverId: "whatsapp-manager-ws",
  }

  try {
    // إرسال عبر Socket.IO
    io.emit(event, data)

    // إرسال عبر WebSocket التقليدي
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify(message))
        } catch (error) {
          console.error("Error broadcasting to WebSocket client:", error)
          systemStats.errors++
        }
      }
    })

    systemStats.messagesProcessed++
    console.log(`📡 Broadcasted ${event} to all clients`)
  } catch (error) {
    console.error("Error in broadcastToAll:", error)
    systemStats.errors++
  }
}

// Middleware للمصادقة في Socket.IO محسن
io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.replace("Bearer ", "") ||
      socket.handshake.query.token

    if (!token) {
      console.warn("Socket.IO connection without token")
      // السماح بالاتصال بدون مصادقة للتطوير فقط
      if (NODE_ENV === "development") {
        return next()
      } else {
        return next(new Error("Authentication required"))
      }
    }

    const decoded = verifyToken(token)
    if (decoded) {
      socket.user = decoded
      socket.authenticated = true
      console.log(`✅ Authenticated Socket.IO user: ${decoded.id || decoded.username}`)
    } else {
      console.warn("Invalid token for Socket.IO connection")
      if (NODE_ENV === "production") {
        return next(new Error("Invalid token"))
      }
    }

    next()
  } catch (error) {
    console.error("Socket.IO authentication error:", error)
    next(new Error("Authentication error"))
  }
})

// معالجات Socket.IO محسنة
io.on("connection", (socket) => {
  const clientId = generateClientId()
  systemStats.totalConnections++
  systemStats.activeConnections++

  console.log(`✅ Socket.IO client connected: ${clientId} (${socket.id})`)

  // تسجيل العميل
  socket.clientId = clientId
  socket.connectedAt = new Date()
  socket.lastActivity = new Date()

  // إرسال معلومات الاتصال
  socket.emit("connected", {
    clientId,
    serverId: "whatsapp-manager-ws",
    version: systemStats.version,
    timestamp: new Date().toISOString(),
    authenticated: socket.authenticated || false,
  })

  // معالج قطع الاتصال
  socket.on("disconnect", (reason) => {
    systemStats.activeConnections--
    console.log(`❌ Socket.IO client disconnected: ${clientId} (${reason})`)
  })
})

// API Routes للتحكم في WebSocket محسنة
app.get("/", (req, res) => {
  updateSystemStats()
  res.json({
    service: "WhatsApp Manager WebSocket Server",
    version: systemStats.version,
    status: "running",
    uptime: systemStats.uptime,
    ubuntu: "24.04 LTS Support",
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  })
})

app.get("/health", (req, res) => {
  updateSystemStats()
  res.json({
    status: "healthy",
    version: systemStats.version,
    uptime: systemStats.uptime,
    stats: systemStats,
    timestamp: new Date().toISOString(),
  })
})

// معالجة إشارات النظام محسنة
const gracefulShutdown = (signal) => {
  console.log(`🛑 Received ${signal}, shutting down gracefully...`)

  // إشعار جميع العملاء بالإغلاق
  broadcastToAll("server_shutdown", {
    message: "Server is shutting down",
    timestamp: new Date().toISOString(),
  })

  // إغلاق الاتصالات الجديدة
  server.close(() => {
    console.log("✅ WebSocket server closed")
    process.exit(0)
  })

  // إغلاق قسري بعد 10 ثواني
  setTimeout(() => {
    console.error("❌ Could not close connections in time, forcefully shutting down")
    process.exit(1)
  }, 10000)
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
process.on("SIGINT", () => gracefulShutdown("SIGINT"))
process.on("SIGUSR2", () => gracefulShutdown("SIGUSR2"))

// معالجة الأخطاء غير المتوقعة
process.on("uncaughtException", (error) => {
  console.error("🚨 Uncaught Exception:", error)
  systemStats.errors++
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("🚨 Unhandled Rejection at:", promise, "reason:", reason)
  systemStats.errors++
})

// بدء الخادم
server.listen(PORT, "0.0.0.0", () => {
  console.log(`
🚀 WhatsApp Manager WebSocket Server v${systemStats.version}
📡 Socket.IO + WebSocket Server running on port ${PORT}
🐧 Ubuntu 24.04 LTS Support: ✅
🌐 Environment: ${NODE_ENV}
📊 Health Check: http://localhost:${PORT}/health
🔗 Frontend URL: ${FRONTEND_URL}
⏰ Started at: ${new Date().toISOString()}
  `)

  // إرسال إشارة جاهزية لـ PM2
  if (process.send) {
    process.send("ready")
  }
})

// تصدير للاستخدام كوحدة
module.exports = {
  server,
  io,
  wss,
  broadcastToAll,
  systemStats,
  connectedClients,
  deviceStatuses,
}
EOL

    chmod +x websocket-server.js
    print_success "تم تحديث websocket-server.js"

    # تحديث ecosystem.config.js
    print_header "تحديث إعدادات PM2"
    print_step "إنشاء ecosystem.config.js محسن..."

    cat > ecosystem.config.js << 'EOL'
module.exports = {
  apps: [
    {
      name: "whatsapp-manager-app",
      script: "server.js",
      cwd: process.cwd(),
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOST: "0.0.0.0",
        PUPPETEER_EXECUTABLE_PATH: "/usr/bin/chromium-browser",
        PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: "true",
        PUPPETEER_ARGS: "--no-sandbox,--disable-setuid-sandbox,--disable-dev-shm-usage",
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",
        ADMIN_USERNAME: process.env.ADMIN_USERNAME || "admin",
        ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "admin123",
        MAX_AUTH_ATTEMPTS: process.env.MAX_AUTH_ATTEMPTS || "5",
        DATABASE_PATH: process.env.DATABASE_PATH || "./data/whatsapp_manager.db",
        NEXT_PUBLIC_DOMAIN_NAME: process.env.NEXT_PUBLIC_DOMAIN_NAME,
        NEXT_PUBLIC_WHATSAPP_API_URL: process.env.NEXT_PUBLIC_WHATSAPP_API_URL,
        FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
        LOG_LEVEL: process.env.LOG_LEVEL || "info",
        ENABLE_WEBSOCKET: process.env.ENABLE_WEBSOCKET || "true",
        WEBSOCKET_PORT: process.env.WEBSOCKET_PORT || "3001",
        NEXT_PUBLIC_WEBSOCKET_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL,
      },
      error_file: "logs/app-error.log",
      out_file: "logs/app-out.log",
      log_file: "logs/app-combined.log",
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 4000,
      kill_timeout: 5000,
      listen_timeout: 3000,
      wait_ready: true,
    },
    {
      name: "whatsapp-manager-websocket",
      script: "websocket-server.js",
      cwd: process.cwd(),
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        WEBSOCKET_PORT: 3001,
        FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",
        LOG_LEVEL: process.env.LOG_LEVEL || "info",
      },
      error_file: "logs/websocket-error.log",
      out_file: "logs/websocket-out.log",
      log_file: "logs/websocket-combined.log",
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 4000,
      kill_timeout: 5000,
      listen_timeout: 3000,
      wait_ready: true,
    },
  ],
}
EOL

    print_success "تم تحديث ecosystem.config.js"

    # تحديث lib/config.js
    print_header "تحديث ملف التكوين"
    print_step "إنشاء lib/config.js محسن..."

    cat > lib/config.js << 'EOL'
require("dotenv").config()

// تكوين متغيرات البيئة مع قيم افتراضية آمنة
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV !== "production" ? "your-secret-key" : undefined)

if (!JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET is not defined in production environment")
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h"

// إعدادات إضافية
const config = {
  // إعدادات الخادم
  PORT: process.env.PORT || 3000,
  HOST: process.env.HOST || "0.0.0.0",
  NODE_ENV: process.env.NODE_ENV || "development",

  // إعدادات JWT
  JWT_SECRET,
  JWT_EXPIRES_IN,

  // إعدادات المدير
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || "admin",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "admin123",
  MAX_AUTH_ATTEMPTS: Number.parseInt(process.env.MAX_AUTH_ATTEMPTS) || 5,

  // إعدادات قاعدة البيانات
  DATABASE_PATH: process.env.DATABASE_PATH || "./data/whatsapp_manager.db",

  // إعدادات WebSocket
  WEBSOCKET_PORT: Number.parseInt(process.env.WEBSOCKET_PORT) || 3001,
  ENABLE_WEBSOCKET: process.env.ENABLE_WEBSOCKET === "true",
  NEXT_PUBLIC_WEBSOCKET_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:3001",

  // إعدادات WhatsApp
  WHATSAPP_SERVER_PORT: Number.parseInt(process.env.WHATSAPP_SERVER_PORT) || 3002,
  PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium-browser",

  // إعدادات الدومين
  NEXT_PUBLIC_DOMAIN_NAME: process.env.NEXT_PUBLIC_DOMAIN_NAME || "localhost",
  NEXT_PUBLIC_WHATSAPP_API_URL: process.env.NEXT_PUBLIC_WHATSAPP_API_URL || "http://localhost:3000/api",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",

  // إعدادات السجلات
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
}

// تصدير المتغيرات المطلوبة بالاسم
module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  config,
}
EOL

    print_success "تم تحديث lib/config.js"

    # تحديث إعدادات nginx
    print_header "تحديث إعدادات nginx"
    print_step "إنشاء تكوين nginx محسن..."

    cat > etc/nginx/sites-available/wa-api.developments.world << 'EOL'
# تكوين nginx محسن لـ WhatsApp Manager
# يدعم HTTP/2, WebSocket, وتحسينات الأداء

# إعادة توجيه HTTP إلى HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name wa-api.developments.world;
    return 301 https://$server_name$request_uri;
}

# الخادم الرئيسي HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name wa-api.developments.world;
    
    # إعدادات SSL محسنة
    ssl_certificate /etc/letsencrypt/live/wa-api.developments.world/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wa-api.developments.world/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/wa-api.developments.world/chain.pem;
    
    # إعدادات الأمان المحسنة
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    
    # إعدادات الأمان
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # إعدادات عامة محسنة
    client_max_body_size 50M;
    client_body_timeout 60s;
    client_header_timeout 60s;
    keepalive_timeout 65s;
    
    # إعدادات WebSocket محسنة - البورت 3001
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
        proxy_buffering off;
    }
    
    # WebSocket التقليدي
    location /ws {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
        proxy_buffering off;
    }
    
    # إعدادات Next.js API routes - البورت 3000
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # إعدادات الـ Proxy للتطبيق الرئيسي - البورت 3000
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # إعدادات السجلات
    access_log /var/log/nginx/wa-api.developments.world-access.log;
    error_log /var/log/nginx/wa-api.developments.world-error.log;
}
EOL

    print_success "تم تحديث إعدادات nginx"

    # إنشاء سكريبت التشخيص
    print_header "إنشاء سكريبت التشخيص"
    print_step "إنشاء scripts/diagnose.js..."

    cat > scripts/diagnose.js << 'EOL'
#!/usr/bin/env node

/**
 * سكريبت تشخيص شامل لـ WhatsApp Manager
 * يفحص جميع متطلبات النظام والإعدادات
 */

require("dotenv").config()
const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")
const os = require("os")

// ألوان للطباعة
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
  bright: "\x1b[1m",
}

function printHeader(text) {
  console.log(`\n${colors.blue}${colors.bright}=== ${text} ===${colors.reset}\n`)
}

function printSuccess(text) {
  console.log(`${colors.green}✓ ${text}${colors.reset}`)
}

function printWarning(text) {
  console.log(`${colors.yellow}⚠ ${text}${colors.reset}`)
}

function printError(text) {
  console.log(`${colors.red}✗ ${text}${colors.reset}`)
}

function printInfo(text) {
  console.log(`${colors.cyan}ℹ ${text}${colors.reset}`)
}

async function runDiagnostics() {
  printHeader("بدء تشخيص WhatsApp Manager")
  console.log(`تاريخ التشغيل: ${new Date().toLocaleString()}`)
  console.log(`نظام التشغيل: ${os.type()} ${os.release()}`)
  console.log(`المعالج: ${os.cpus()[0].model}`)
  console.log(`الذاكرة: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`)
  
  let allPassed = true
  let warnings = 0
  
  // فحص متطلبات النظام
  printHeader("فحص متطلبات النظام")
  
  // فحص Node.js
  try {
    const nodeVersion = process.version
    const nodeVersionNum = Number.parseFloat(nodeVersion.slice(1))
    
    if (nodeVersionNum >= 18) {
      printSuccess(`Node.js: ${nodeVersion}`)
    } else {
      printWarning(`Node.js: ${nodeVersion} - يوصى بالإصدار 18 أو أعلى`)
      warnings++
    }
  } catch (error) {
    printError(`فشل فحص إصدار Node.js: ${error.message}`)
    allPassed = false
  }
  
  // فحص npm
  try {
    const npmVersion = execSync("npm --version").toString().trim()
    printSuccess(`npm: ${npmVersion}`)
  } catch (error) {
    printError(`فشل فحص إصدار npm: ${error.message}`)
    allPassed = false
  }
  
  // فحص PM2
  try {
    const pm2Version = execSync("pm2 --version").toString().trim()
    printSuccess(`PM2: ${pm2Version}`)
  } catch (error) {
    printError("PM2: غير مثبت أو غير متاح في PATH")
    printInfo("قم بتثبيت PM2 باستخدام: npm install -g pm2")
    allPassed = false
  }
  
  // فحص المجلدات والملفات
  printHeader("فحص المجلدات والملفات")
  
  const requiredDirs = ["data", "data/whatsapp_sessions", "data/media", "logs"]
  
  for (const dir of requiredDirs) {
    const dirPath = path.join(process.cwd(), dir)
    
    if (fs.existsSync(dirPath)) {
      try {
        const testFile = path.join(dirPath, `.test-${Date.now()}`)
        fs.writeFileSync(testFile, "test")
        fs.unlinkSync(testFile)
        printSuccess(`المجلد ${dir}: موجود ولديه صلاحيات الكتابة`)
      } catch (error) {
        printError(`المجلد ${dir}: موجود ولكن لا يمكن الكتابة فيه`)
        allPassed = false
      }
    } else {
      printError(`المجلد ${dir}: غير موجود`)
      allPassed = false
    }
  }
  
  // فحص الملفات المطلوبة
  const requiredFiles = [
    "ecosystem.config.js",
    "websocket-server.js",
    "server.js",
    "lib/config.js",
  ]
  
  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file)
    
    if (fs.existsSync(filePath)) {
      printSuccess(`الملف ${file}: موجود`)
    } else {
      printError(`الملف ${file}: غير موجود`)
      allPassed = false
    }
  }
  
  // فحص متغيرات البيئة
  printHeader("فحص متغيرات البيئة")
  
  const requiredEnvVars = ["JWT_SECRET", "ADMIN_USERNAME", "ADMIN_PASSWORD"]
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      printSuccess(`${envVar}: تم تعيينه`)
    } else {
      printError(`${envVar}: غير معين`)
      allPassed = false
    }
  }
  
  // النتيجة النهائية
  printHeader("نتيجة التشخيص")
  
  if (allPassed && warnings === 0) {
    printSuccess("✅ جميع الفحوصات اجتازت بنجاح!")
    console.log(`\n${colors.green}${colors.bright}WhatsApp Manager جاهز للعمل!${colors.reset}\n`)
  } else if (allPassed) {
    printWarning(`⚠️ اجتازت جميع الفحوصات الأساسية، ولكن هناك ${warnings} تحذيرات`)
    console.log(`\n${colors.yellow}${colors.bright}WhatsApp Manager يعمل، ولكن يمكن تحسينه!${colors.reset}\n`)
  } else {
    printError("❌ فشلت بعض الفحوصات الأساسية")
    console.log(`\n${colors.red}${colors.bright}يجب إصلاح المشاكل قبل تشغيل WhatsApp Manager!${colors.reset}\n`)
  }
}

runDiagnostics().catch(error => {
  console.error(`خطأ في التشخيص: ${error.message}`)
  process.exit(1)
})
EOL

    chmod +x scripts/diagnose.js
    print_success "تم إنشاء سكريبت التشخيص"

    # إنشاء سكريبت الإعداد
    print_header "إنشاء سكريبت الإعداد"
    print_step "إنشاء scripts/setup.js..."

    cat > scripts/setup.js << 'EOL'
#!/usr/bin/env node

/**
 * سكريبت إعداد شامل لـ WhatsApp Manager
 * يقوم بإعداد البيئة وتهيئة المشروع
 */

require("dotenv").config()
const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")
const readline = require("readline")
const crypto = require("crypto")

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer)
    })
  })
}

function generateJwtSecret() {
  return crypto.randomBytes(32).toString("hex")
}

function generateRandomPassword(length = 16) {
  return crypto.randomBytes(length).toString("hex").slice(0, length)
}

async function setup() {
  console.log("🚀 مرحبًا بك في إعداد WhatsApp Manager")
  
  const envVars = {}
  
  // JWT_SECRET
  const useRandomJwtSecret = await question("هل تريد استخدام JWT_SECRET عشوائي؟ (y/n): ")
  
  if (useRandomJwtSecret.toLowerCase() === "y") {
    envVars.JWT_SECRET = generateJwtSecret()
    console.log("✅ تم إنشاء JWT_SECRET عشوائي")
  } else {
    envVars.JWT_SECRET = await question("أدخل JWT_SECRET: ")
    if (!envVars.JWT_SECRET) {
      envVars.JWT_SECRET = generateJwtSecret()
      console.log("⚠️ تم استخدام JWT_SECRET عشوائي")
    }
  }
  
  // بيانات المدير
  envVars.ADMIN_USERNAME = await question("أدخل اسم المستخدم للمدير (admin): ") || "admin"
  
  const useRandomPassword = await question("هل تريد استخدام كلمة مرور عشوائية؟ (y/n): ")
  
  if (useRandomPassword.toLowerCase() === "y") {
    envVars.ADMIN_PASSWORD = generateRandomPassword()
    console.log(`✅ كلمة المرور: ${envVars.ADMIN_PASSWORD}`)
    console.log("⚠️ احفظ كلمة المرور هذه!")
  } else {
    envVars.ADMIN_PASSWORD = await question("أدخل كلمة مرور المدير: ") || "admin123"
  }
  
  // إعدادات أخرى
  envVars.NODE_ENV = "development"
  envVars.PORT = "3000"
  envVars.WEBSOCKET_PORT = "3001"
  envVars.DATABASE_PATH = "./data/whatsapp_manager.db"
  envVars.ENABLE_WEBSOCKET = "true"
  
  // إنشاء ملف .env
  let envContent = ""
  for (const [key, value] of Object.entries(envVars)) {
    envContent += `${key}=${value}\n`
  }
  
  fs.writeFileSync(".env", envContent)
  console.log("✅ تم إنشاء ملف .env")
  
  // إنشاء المجلدات
  const dirs = ["data", "data/whatsapp_sessions", "data/media", "logs"]
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log(`✅ تم إنشاء المجلد: ${dir}`)
    }
  }
  
  console.log("\n🎉 تم إعداد WhatsApp Manager بنجاح!")
  console.log(`\n📋 معلومات الوصول:`)
  console.log(`   اسم المستخدم: ${envVars.ADMIN_USERNAME}`)
  console.log(`   كلمة المرور: ${envVars.ADMIN_PASSWORD}`)
  
  rl.close()
}

setup().catch(error => {
  console.error(`خطأ في الإعداد: ${error.message}`)
  rl.close()
  process.exit(1)
})
EOL

    chmod +x scripts/setup.js
    print_success "تم إنشاء سكريبت الإعداد"

    # إنشاء سكريبت init-database.js
    print_header "إنشاء سكريبت تهيئة قاعدة البيانات"
    print_step "إنشاء scripts/init-database.js..."

    cat > scripts/init-database.js << 'EOL'
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
EOL

    chmod +x scripts/init-database.js
    print_success "تم إنشاء سكريبت تهيئة قاعدة البيانات"

    # إنشاء ملف .env.example
    print_header "إنشاء ملف .env.example"
    print_step "إنشاء ملف مثال للمتغيرات البيئية..."

    cat > .env.example << 'EOL'
# إعدادات WhatsApp Manager
# نسخة عن ملف .env للمرجعية

# إعدادات الخادم
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# إعدادات JWT
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=24h

# إعدادات المدير
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
MAX_AUTH_ATTEMPTS=5

# إعدادات قاعدة البيانات
DATABASE_PATH=./data/whatsapp_manager.db

# إعدادات WebSocket
ENABLE_WEBSOCKET=true
WEBSOCKET_PORT=3001
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3001

# إعدادات WhatsApp
WHATSAPP_SERVER_PORT=3002
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# إعدادات الدومين
NEXT_PUBLIC_DOMAIN_NAME=localhost
NEXT_PUBLIC_WHATSAPP_API_URL=http://localhost:3000/api
FRONTEND_URL=http://localhost:3000

# إعدادات السجلات
LOG_LEVEL=info
EOL

    print_success "تم إنشاء ملف .env.example"

    # إنشاء سكريبتات التحكم
    print_header "إنشاء سكريبتات التحكم"
    
    # سكريبت start.sh
    print_step "إنشاء start.sh..."
    cat > start.sh << 'EOL'
#!/bin/bash

# سكريبت تشغيل WhatsApp Manager

echo "🚀 بدء تشغيل WhatsApp Manager"

# التحقق من وجود ملف .env
if [ ! -f ".env" ]; then
    echo "❌ ملف .env غير موجود"
    echo "⚠️ قم بنسخ .env.example إلى .env وتعديل القيم"
    exit 1
fi

# إنشاء المجلدات المطلوبة
mkdir -p data/whatsapp_sessions data/media logs

# التحقق من قاعدة البيانات
if [ ! -f "./data/whatsapp_manager.db" ]; then
    echo "⚠️ قاعدة البيانات غير موجودة، سيتم إنشاؤها..."
    node scripts/init-database.js
fi

# إيقاف أي نسخة قديمة
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# تشغيل التطبيق
pm2 start ecosystem.config.js

if [ $? -eq 0 ]; then
    echo "✅ تم تشغيل التطبيق بنجاح"
    pm2 save
    sleep 3
    pm2 status
    echo ""
    echo "🌐 واجهة المستخدم: http://localhost:3000"
    echo "👤 اسم المستخدم: admin"
    echo "🔑 كلمة المرور: admin123"
else
    echo "❌ فشل تشغيل التطبيق"
    exit 1
fi
EOL

    chmod +x start.sh
    print_success "تم إنشاء start.sh"

    # سكريبت stop.sh
    print_step "إنشاء stop.sh..."
    cat > stop.sh << 'EOL'
#!/bin/bash

echo "🛑 إيقاف WhatsApp Manager"

pm2 stop all
pm2 delete all

echo "✅ تم إيقاف التطبيق"
EOL

    chmod +x stop.sh
    print_success "تم إنشاء stop.sh"

    # سكريبت restart.sh
    print_step "إنشاء restart.sh..."
    cat > restart.sh << 'EOL'
#!/bin/bash

echo "🔄 إعادة تشغيل WhatsApp Manager"

pm2 restart all

if [ $? -eq 0 ]; then
    echo "✅ تم إعادة تشغيل التطبيق"
    sleep 3
    pm2 status
else
    echo "❌ فشل إعادة تشغيل التطبيق"
fi
EOL

    chmod +x restart.sh
    print_success "تم إنشاء restart.sh"

    # تحديث package.json
    print_header "تحديث package.json"
    
    if command_exists jq && [ -f "package.json" ]; then
        print_step "إضافة سكريبتات جديدة إلى package.json..."
        
        # إضافة السكريبتات الجديدة
        jq '.scripts.setup = "node scripts/setup.js"' package.json > package.json.tmp && mv package.json.tmp package.json
        jq '.scripts.diagnose = "node scripts/diagnose.js"' package.json > package.json.tmp && mv package.json.tmp package.json
        jq '.scripts["init-db"] = "node scripts/init-database.js"' package.json > package.json.tmp && mv package.json.tmp package.json
        jq '.scripts.start = "./start.sh"' package.json > package.json.tmp && mv package.json.tmp package.json
        jq '.scripts.stop = "./stop.sh"' package.json > package.json.tmp && mv package.json.tmp package.json
        jq '.scripts.restart = "./restart.sh"' package.json > package.json.tmp && mv package.json.tmp package.json
        
        print_success "تم تحديث package.json"
    else
        print_warning "jq غير مثبت أو package.json غير موجود، تم تخطي تحديث package.json"
    fi

    # إنشاء ملف .gitignore محسن
    print_header "إنشاء ملف .gitignore محسن"
    
    cat > .gitignore << 'EOL'
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# WhatsApp Manager specific
/data/whatsapp_manager.db
/data/whatsapp_sessions/
/data/media/
/logs/
.wwebjs_auth/
.wwebjs_cache/

# Backup files
backup_*/
*.bak
*.backup
*.old

# IDE files
.idea/
.vscode/
*.swp
*.swo
EOL

    print_success "تم إنشاء ملف .gitignore محسن"

    # تعيين الصلاحيات
    print_header "تعيين الصلاحيات"
    
    chmod +x websocket-server.js
    chmod +x scripts/*.js
    chmod +x *.sh
    
    print_success "تم تعيين الصلاحيات للملفات"

    # النتيجة النهائية
    print_header "اكتمل التحديث بنجاح!"
    
    echo -e "${GREEN}${BOLD}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║               🎉 تم التحديث بنجاح! 🎉                      ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}\n"
    
    echo -e "${CYAN}${BOLD}الملفات المحدثة:${NC}"
    echo -e "${GREEN}  ✓ websocket-server.js - خادم WebSocket محسن${NC}"
    echo -e "${GREEN}  ✓ ecosystem.config.js - إعدادات PM2 محسنة${NC}"
    echo -e "${GREEN}  ✓ lib/config.js - ملف التكوين المحسن${NC}"
    echo -e "${GREEN}  ✓ etc/nginx/sites-available/wa-api.developments.world - إعدادات nginx${NC}"
    echo -e "${GREEN}  ✓ scripts/diagnose.js - سكريبت التشخيص${NC}"
    echo -e "${GREEN}  ✓ scripts/setup.js - سكريبت الإعداد${NC}"
    echo -e "${GREEN}  ✓ scripts/init-database.js - سكريبت تهيئة قاعدة البيانات${NC}"
    echo -e "${GREEN}  ✓ start.sh, stop.sh, restart.sh - سكريبتات التحكم${NC}"
    echo -e "${GREEN}  ✓ .env.example - ملف مثال للمتغيرات البيئية${NC}"
    echo -e "${GREEN}  ✓ .gitignore - ملف gitignore محسن${NC}"
    
    echo -e "\n${CYAN}${BOLD}خطوات التشغيل:${NC}"
    echo -e "${YELLOW}  1. تشغيل الإعداد التلقائي: ${BOLD}node scripts/setup.js${NC}"
    echo -e "${YELLOW}  2. أو التشغيل اليدوي: ${BOLD}./start.sh${NC}"
    echo -e "${YELLOW}  3. فحص الحالة: ${BOLD}npm run diagnose${NC}"
    echo -e "${YELLOW}  4. مراقبة السجلات: ${BOLD}pm2 logs${NC}"
    
    echo -e "\n${CYAN}${BOLD}أوامر مفيدة:${NC}"
    echo -e "${BLUE}  • تشغيل التطبيق: ${BOLD}./start.sh${NC}"
    echo -e "${BLUE}  • إيقاف التطبيق: ${BOLD}./stop.sh${NC}"
    echo -e "${BLUE}  • إعادة التشغيل: ${BOLD}./restart.sh${NC}"
    echo -e "${BLUE}  • التشخيص: ${BOLD}npm run diagnose${NC}"
    echo -e "${BLUE}  • الإعداد: ${BOLD}npm run setup${NC}"
    
    echo -e "\n${YELLOW}${BOLD}تذكير:${NC} تم إنشاء نسخة احتياطية في المجلد: ${BOLD}$BACKUP_DIR${NC}"
    
    echo -e "\n${GREEN}${BOLD}🚀 WhatsApp Manager جاهز للعمل! 🚀${NC}\n"
}

# تشغيل الدالة الرئيسية
main "$@"
