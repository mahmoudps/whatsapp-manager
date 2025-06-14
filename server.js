#!/usr/bin/env node

/**
 * خادم WhatsApp Manager
 */

const path = require("path")
require("dotenv").config({ path: path.join(__dirname, ".env") })
const express = require("express")
const next = require("next")
const http = require("http")
const WebSocket = require("ws")
const fs = require("fs")
const cors = require("cors")
const compression = require("compression")
const helmet = require("helmet")
const cookieParser = require("cookie-parser")
const csurf = require("csurf")
const { CORS_ORIGIN } = require("./lib/config")
const { logger } = require("./lib/logger")

// تهيئة المتغيرات
const dev = process.env.NODE_ENV !== "production"
const port = Number.parseInt(process.env.PORT || "3000", 10)
const wsPort = Number.parseInt(process.env.WEBSOCKET_PORT || "3001", 10)
const enableWebSocket = process.env.ENABLE_WEBSOCKET === "true"

// تهيئة Next.js
const app = next({ dev })
const handle = app.getRequestHandler()

// إنشاء مجلدات البيانات إذا لم تكن موجودة
const dataDir = path.join(__dirname, "data")
const mediaDir = path.join(dataDir, "media")
const sessionsDir = path.join(dataDir, "whatsapp_sessions")
const logsDir = path.join(__dirname, "logs")
;[dataDir, mediaDir, sessionsDir, logsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    logger.info(`📁 تم إنشاء مجلد ${dir}`)
  }
})

// بدء تشغيل التطبيق
app.prepare().then(() => {
  const server = express()

  // إعدادات الأمان والأداء
  server.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  )
  server.use(compression())
  server.use(
    cors({
      origin: CORS_ORIGIN ? CORS_ORIGIN.split(',') : false,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )

  // معالجة ملفات الكوكيز وتوليد رمز CSRF
  server.use(cookieParser())
  const csrfProtection = csurf({ cookie: true })
  server.use(csrfProtection)

  // مسار لإرجاع رمز CSRF للواجهة
  server.get("/api/csrf-token", (req, res) => {
    res.json({ csrfToken: req.csrfToken() })
  })

  // معالجة أخطاء CSRF
  server.use((err, req, res, next) => {
    if (err.code === "EBADCSRFTOKEN") {
      return res.status(403).json({ error: "Invalid CSRF token" })
    }
    next(err)
  })

  // معالجة الطلبات الثابتة
  server.use("/media", express.static(mediaDir))

  // توجيه جميع الطلبات إلى Next.js
  server.all("*", (req, res) => {
    return handle(req, res)
  })

  // بدء تشغيل الخادم
  const httpServer = http.createServer(server)
  httpServer.listen(port, () => {
    logger.info(`🚀 خادم WhatsApp Manager يعمل على المنفذ ${port}`)
  })

  // إعداد خادم WebSocket إذا كان مفعلاً
  if (enableWebSocket) {
    const wss = new WebSocket.Server({ port: wsPort })

    wss.on("connection", (ws) => {
      logger.info("🔌 اتصال WebSocket جديد")

      ws.on("message", (message) => {
        try {
          const data = JSON.parse(message)
          logger.debug(`📩 رسالة WebSocket واردة: ${data.event}`)

          // إعادة توجيه الرسالة إلى جميع العملاء المتصلين
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(message)
            }
          })
        } catch (error) {
          logger.error("❌ خطأ في معالجة رسالة WebSocket:", error)
        }
      })

      ws.on("close", () => {
        logger.info("🔌 انقطع اتصال WebSocket")
      })

      // إرسال رسالة ترحيب
      ws.send(
        JSON.stringify({
          event: "connection_established",
          data: {
            message: "تم الاتصال بنجاح بخادم WebSocket",
            timestamp: new Date().toISOString(),
          },
        }),
      )
    })

    logger.info(`🔌 خادم WebSocket يعمل على المنفذ ${wsPort}`)
  }
})
