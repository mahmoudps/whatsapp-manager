require("dotenv").config()
const { createServer } = require("http")
const { parse } = require("url")
const next = require("next")
const helmet = require("helmet")
const compression = require("compression")
const rateLimit = require("express-rate-limit")
const { initializeDatabase } = require("./lib/database.js")

const dev = process.env.NODE_ENV !== "production"
const hostname = process.env.HOST || "0.0.0.0"
const port = Number.parseInt(process.env.PORT, 10) || 3000

// تكوين حد معدل الطلبات
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100, // حد الطلبات لكل IP
  message: "Too many requests from this IP, please try again later.",
})

console.log("🚀 Starting WhatsApp Manager Server...")
console.log(`📊 Environment: ${process.env.NODE_ENV}`)
console.log(`🌐 Port: ${port}`)
console.log(`🏠 Hostname: ${hostname}`)

// إنشاء تطبيق Next.js
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// دالة لبدء الخادم
async function startServer() {
  try {
    console.log("🔄 Initializing database...")
    await initializeDatabase()
    console.log("✅ Database initialized")
    console.log("🔄 Preparing Next.js application...")
    await app.prepare()
    console.log("✅ Next.js application prepared successfully")

    // إنشاء خادم HTTP
    const server = createServer(async (req, res) => {
      try {
        // تطبيق حد معدل الطلبات
        await limiter(req, res)

        // تطبيق الأمان والضغط
        helmet()(req, res, () => {})
        compression()(req, res, () => {})

        const parsedUrl = parse(req.url, true)
        await handle(req, res, parsedUrl)
      } catch (err) {
        console.error("❌ Error handling request:", err)
        res.statusCode = 500
        res.end(JSON.stringify({ error: "Internal Server Error" }))
      }
    })

    // معالجة الأخطاء
    server.on("error", (err) => {
      console.error("🚨 Server error:", err)
      if (err.code === "EADDRINUSE") {
        console.error(`❌ Port ${port} is already in use`)
        process.exit(1)
      } else {
        console.error("❌ Unexpected error:", err)
      }
    })

    // بدء الاستماع
    server.listen(port, hostname, () => {
      console.log(`✅ Server running on http://${hostname}:${port}`)
      console.log(`🔗 Ready to accept connections`)

      // إرسال إشارة جاهزية
      if (process.send) {
        process.send("ready")
      }
    })

    // معالجة إيقاف التشغيل بأمان
    const gracefulShutdown = async (signal) => {
      console.log(`🛑 Received ${signal}, shutting down gracefully...`)
      
      // إغلاق الاتصالات النشطة
      server.close(() => {
        console.log("✅ Server closed successfully")
        process.exit(0)
      })

      // إغلاق بعد مهلة
      setTimeout(() => {
        console.error("❌ Could not close connections in time, forcefully shutting down")
        process.exit(1)
      }, 10000)
    }

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
    process.on("SIGINT", () => gracefulShutdown("SIGINT"))
  } catch (error) {
    console.error("❌ Failed to start server:", error)
    process.exit(1)
  }
}

// بدء الخادم
startServer().catch((error) => {
  console.error("❌ Startup error:", error)
  process.exit(1)
})
