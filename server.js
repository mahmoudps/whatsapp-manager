#!/usr/bin/env node

/**
 * خادم WhatsApp Manager
 */

require("dotenv").config()
const express = require("express")
const next = require("next")
const http = require("http")
const WebSocket = require("ws")
const path = require("path")
const fs = require("fs")
const cors = require("cors")
const compression = require("compression")
const helmet = require("helmet")

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
    console.log(`📁 تم إنشاء مجلد ${dir}`)
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
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )

  // معالجة الطلبات الثابتة
  server.use("/media", express.static(mediaDir))

  // توجيه جميع الطلبات إلى Next.js
  server.all("*", (req, res) => {
    return handle(req, res)
  })

  // بدء تشغيل الخادم
  const httpServer = http.createServer(server)
  httpServer.listen(port, () => {
    console.log(`🚀 خادم WhatsApp Manager يعمل على المنفذ ${port}`)
  })

  // إعداد خادم WebSocket إذا كان مفعلاً
  if (enableWebSocket) {
    const wss = new WebSocket.Server({ port: wsPort })

    wss.on("connection", (ws) => {
      console.log("🔌 اتصال WebSocket جديد")

      ws.on("message", (message) => {
        try {
          const data = JSON.parse(message)
          console.log(`📩 رسالة WebSocket واردة: ${data.event}`)

          // إعادة توجيه الرسالة إلى جميع العملاء المتصلين
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(message)
            }
          })
        } catch (error) {
          console.error("❌ خطأ في معالجة رسالة WebSocket:", error)
        }
      })

      ws.on("close", () => {
        console.log("🔌 انقطع اتصال WebSocket")
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

    console.log(`🔌 خادم WebSocket يعمل على المنفذ ${wsPort}`)
  }
})
