#!/usr/bin/env node

/**
 * WebSocket Server محسن لـ WhatsApp Manager
 * يدعم Socket.IO و ws مع Ubuntu 24
 * الإصدار 8.0.0
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

// إعدادات البيئة
const PORT = process.env.WEBSOCKET_PORT || 3001
const NODE_ENV = process.env.NODE_ENV || "development"
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000"

let JWT_SECRET, JWT_EXPIRES_IN
try {
  ;({ JWT_SECRET, JWT_EXPIRES_IN } = require("./lib/config"))
} catch (err) {
  JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-change-in-production"
  JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h"
}

// Validate JWT_SECRET
if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET is not defined!")
  process.exit(1)
}

if (JWT_SECRET === "fallback-secret-key-change-in-production" && process.env.NODE_ENV === "production") {
  console.error("❌ Please set a secure JWT_SECRET in production!")
  process.exit(1)
}

console.log("🚀 Starting WhatsApp Manager WebSocket Server v8.0.0")
console.log("🐧 Ubuntu 24.04 LTS Support: ✅")
console.log("🌐 Environment:", NODE_ENV)
console.log("📡 Port:", PORT)
console.log("🔗 Frontend URL:", FRONTEND_URL)

// إعداد Express
const app = express()
const server = createServer(app)

// إعدادات الأمان
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  }),
)

app.use(compression())
app.use(
  cors({
    origin: [FRONTEND_URL, "http://localhost:3000", "https://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
)

app.use(express.json({ limit: "10mb" }))

// إعداد Socket.IO مع دعم Ubuntu 24
const io = new Server(server, {
  cors: {
    origin: [FRONTEND_URL, "http://localhost:3000", "https://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
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
    clientMaxWindow: 13,
    serverMaxWindow: 13,
    serverMaxNoContextTakeover: false,
    clientMaxNoContextTakeover: false,
  },
})

// متغيرات النظام
const connectedClients = new Map()
const deviceStatuses = new Map()
const systemStats = {
  startTime: new Date(),
  totalConnections: 0,
  activeConnections: 0,
  messagesProcessed: 0,
  errors: 0,
  version: "8.0.0",
  platform: process.platform,
  nodeVersion: process.version,
}

// دوال مساعدة
function generateClientId() {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

function broadcastToAll(event, data) {
  const message = {
    event,
    data,
    timestamp: new Date().toISOString(),
  }

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
}

function broadcastToDevice(deviceId, event, data) {
  const message = {
    event,
    data,
    deviceId,
    timestamp: new Date().toISOString(),
  }

  // إرسال عبر Socket.IO
  io.to(`device_${deviceId}`).emit(event, data)

  // إرسال عبر WebSocket التقليدي
  connectedClients.forEach((clientInfo, clientId) => {
    if (clientInfo.deviceId === deviceId && clientInfo.ws && clientInfo.ws.readyState === WebSocket.OPEN) {
      try {
        clientInfo.ws.send(JSON.stringify(message))
      } catch (error) {
        console.error(`Error sending to device ${deviceId}:`, error)
        systemStats.errors++
      }
    }
  })

  systemStats.messagesProcessed++
}

// Middleware للمصادقة في Socket.IO
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "")

  if (!token) {
    console.warn("Socket.IO connection without token")
    return next() // السماح بالاتصال بدون مصادقة للتطوير
  }

  const decoded = verifyToken(token)
  if (decoded) {
    socket.user = decoded
    console.log(`✅ Authenticated Socket.IO user: ${decoded.id || decoded.username}`)
  } else {
    console.warn("Invalid token for Socket.IO connection")
  }

  next()
})

// معالجات Socket.IO
io.on("connection", (socket) => {
  const clientId = generateClientId()
  systemStats.totalConnections++
  systemStats.activeConnections++

  console.log(`✅ Socket.IO client connected: ${clientId} (${socket.id})`)

  // تسجيل العميل
  socket.clientId = clientId
  socket.connectedAt = new Date()

  // إرسال معلومات الاتصال
  socket.emit("connected", {
    clientId,
    serverId: "whatsapp-manager-ws",
    version: systemStats.version,
    timestamp: new Date().toISOString(),
    supportedEvents: [
      "device_status_changed",
      "qr_code_generated",
      "message_received",
      "message_sent",
      "device_connected",
      "device_disconnected",
      "system_stats",
    ],
  })

  // الانضمام لغرفة جهاز محدد
  socket.on("join_device", (deviceId) => {
    if (deviceId) {
      socket.join(`device_${deviceId}`)
      socket.deviceId = deviceId
      console.log(`📱 Socket.IO client ${clientId} joined device room: ${deviceId}`)

      // إرسال حالة الجهاز الحالية
      const deviceStatus = deviceStatuses.get(deviceId)
      if (deviceStatus) {
        socket.emit("device_status_changed", deviceStatus)
      }
    }
  })

  // مغادرة غرفة الجهاز
  socket.on("leave_device", (deviceId) => {
    if (deviceId) {
      socket.leave(`device_${deviceId}`)
      console.log(`📱 Socket.IO client ${clientId} left device room: ${deviceId}`)
    }
  })

  // طلب إحصائيات النظام
  socket.on("get_system_stats", () => {
    socket.emit("system_stats", {
      ...systemStats,
      uptime: Date.now() - systemStats.startTime.getTime(),
      connectedDevices: deviceStatuses.size,
      activeSocketConnections: io.engine.clientsCount,
      activeWSConnections: wss.clients.size,
      memory: process.memoryUsage(),
    })
  })

  // طلب حالة جميع الأجهزة
  socket.on("get_all_devices", () => {
    const devices = Array.from(deviceStatuses.entries()).map(([id, status]) => ({
      id,
      ...status,
    }))
    socket.emit("all_devices_status", devices)
  })

  // ping/pong للحفاظ على الاتصال
  socket.on("ping", () => {
    socket.emit("pong", { timestamp: new Date().toISOString() })
  })

  // معالج قطع الاتصال
  socket.on("disconnect", (reason) => {
    systemStats.activeConnections--
    console.log(`❌ Socket.IO client disconnected: ${clientId} (${reason})`)
  })

  // معالج الأخطاء
  socket.on("error", (error) => {
    systemStats.errors++
    console.error(`🚨 Socket.IO error for client ${clientId}:`, error)
  })
})

// معالجات WebSocket التقليدي
wss.on("connection", (ws, req) => {
  const clientId = generateClientId()
  const clientIP = req.socket.remoteAddress

  systemStats.totalConnections++
  systemStats.activeConnections++

  console.log(`✅ WebSocket client connected: ${clientId} from ${clientIP}`)

  // تسجيل العميل
  connectedClients.set(clientId, {
    ws,
    clientId,
    connectedAt: new Date(),
    lastPing: new Date(),
    deviceId: null,
    ip: clientIP,
    authenticated: false,
  })

  // إرسال رسالة ترحيب
  ws.send(
    JSON.stringify({
      event: "connected",
      data: {
        clientId,
        serverId: "whatsapp-manager-ws",
        version: systemStats.version,
        timestamp: new Date().toISOString(),
      },
    }),
  )

  // معالج الرسائل
  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message.toString())
      const client = connectedClients.get(clientId)

      if (!client) return

      client.lastPing = new Date()

      switch (data.event) {
        case "authenticate":
          if (data.token) {
            const decoded = verifyToken(data.token)
            if (decoded) {
              client.authenticated = true
              client.user = decoded
              ws.send(
                JSON.stringify({
                  event: "authenticated",
                  data: { success: true, user: decoded },
                }),
              )
              console.log(`🔐 WebSocket client ${clientId} authenticated as ${decoded.username}`)
            } else {
              ws.send(
                JSON.stringify({
                  event: "authentication_failed",
                  data: { error: "Invalid token" },
                }),
              )
            }
          }
          break

        case "ping":
          ws.send(JSON.stringify({ event: "pong", timestamp: new Date().toISOString() }))
          break

        case "join_device":
          if (data.deviceId) {
            client.deviceId = data.deviceId
            console.log(`📱 WebSocket client ${clientId} joined device: ${data.deviceId}`)

            // إرسال حالة الجهاز الحالية
            const deviceStatus = deviceStatuses.get(data.deviceId)
            if (deviceStatus) {
              ws.send(
                JSON.stringify({
                  event: "device_status_changed",
                  data: deviceStatus,
                }),
              )
            }
          }
          break

        case "get_system_stats":
          ws.send(
            JSON.stringify({
              event: "system_stats",
              data: {
                ...systemStats,
                uptime: Date.now() - systemStats.startTime.getTime(),
                connectedDevices: deviceStatuses.size,
                activeConnections: connectedClients.size,
                memory: process.memoryUsage(),
              },
            }),
          )
          break

        default:
          console.log(`📨 Received message from ${clientId}:`, data.event)
      }
    } catch (error) {
      systemStats.errors++
      console.error(`🚨 Error processing message from ${clientId}:`, error)
    }
  })

  // معالج قطع الاتصال
  ws.on("close", (code, reason) => {
    systemStats.activeConnections--
    connectedClients.delete(clientId)
    console.log(`❌ WebSocket client disconnected: ${clientId} (${code}: ${reason})`)
  })

  // معالج الأخطاء
  ws.on("error", (error) => {
    systemStats.errors++
    console.error(`🚨 WebSocket error for client ${clientId}:`, error)
  })
})

// API Routes للتحكم في WebSocket
app.get("/", (req, res) => {
  res.json({
    service: "WhatsApp Manager WebSocket Server",
    version: systemStats.version,
    status: "running",
    uptime: Date.now() - systemStats.startTime.getTime(),
    ubuntu: "24.04 LTS Support",
    endpoints: {
      health: "/health",
      stats: "/stats",
      broadcast: "/broadcast",
    },
  })
})

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    version: systemStats.version,
    uptime: Date.now() - systemStats.startTime.getTime(),
    stats: {
      ...systemStats,
      socketIOConnections: io.engine.clientsCount,
      webSocketConnections: wss.clients.size,
      connectedDevices: deviceStatuses.size,
    },
    ubuntu: {
      supported: true,
      version: "24.04 LTS",
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
  })
})

app.get("/stats", (req, res) => {
  res.json({
    ...systemStats,
    uptime: Date.now() - systemStats.startTime.getTime(),
    connections: {
      socketIO: io.engine.clientsCount,
      webSocket: wss.clients.size,
      total: io.engine.clientsCount + wss.clients.size,
    },
    devices: Array.from(deviceStatuses.entries()).map(([id, status]) => ({
      id,
      ...status,
    })),
    memory: process.memoryUsage(),
  })
})

app.post("/broadcast", (req, res) => {
  try {
    const { event, data, deviceId } = req.body

    if (!event || !data) {
      return res.status(400).json({ error: "Event and data are required" })
    }

    if (deviceId) {
      broadcastToDevice(deviceId, event, data)
    } else {
      broadcastToAll(event, data)
    }

    res.json({ success: true, timestamp: new Date().toISOString() })
  } catch (error) {
    console.error("Broadcast error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// دوال النظام العامة
function updateDeviceStatus(deviceId, status) {
  deviceStatuses.set(deviceId, {
    ...status,
    lastUpdated: new Date().toISOString(),
  })

  broadcastToAll("device_status_changed", {
    deviceId,
    ...status,
  })
}

function sendQRCode(deviceId, qrCode) {
  broadcastToDevice(deviceId, "qr_code_generated", {
    deviceId,
    qrCode,
    timestamp: new Date().toISOString(),
  })
}

function notifyMessage(deviceId, messageData) {
  broadcastToDevice(deviceId, "message_received", {
    deviceId,
    ...messageData,
    timestamp: new Date().toISOString(),
  })
}

// تنظيف دوري للاتصالات المنقطعة
setInterval(() => {
  const now = new Date()
  const timeout = 5 * 60 * 1000 // 5 دقائق

  connectedClients.forEach((client, clientId) => {
    if (now.getTime() - client.lastPing.getTime() > timeout) {
      console.log(`🧹 Cleaning up inactive client: ${clientId}`)
      if (client.ws && client.ws.readyState === WebSocket.OPEN) {
        client.ws.close(1000, "Timeout")
      }
      connectedClients.delete(clientId)
      systemStats.activeConnections--
    }
  })
}, 60000) // فحص كل دقيقة

// إحصائيات دورية
setInterval(() => {
  const stats = {
    ...systemStats,
    uptime: Date.now() - systemStats.startTime.getTime(),
    connections: {
      socketIO: io.engine.clientsCount,
      webSocket: wss.clients.size,
      total: io.engine.clientsCount + wss.clients.size,
    },
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  }

  broadcastToAll("system_stats", stats)
}, 30000) // كل 30 ثانية

// معالجة إشارات النظام
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully...")
  server.close(() => {
    console.log("✅ WebSocket server closed")
    process.exit(0)
  })
})

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully...")
  server.close(() => {
    console.log("✅ WebSocket server closed")
    process.exit(0)
  })
})

// تصدير الدوال للاستخدام الخارجي
global.wsServer = {
  updateDeviceStatus,
  sendQRCode,
  notifyMessage,
  broadcastToAll,
  broadcastToDevice,
  getStats: () => ({
    ...systemStats,
    uptime: Date.now() - systemStats.startTime.getTime(),
    connections: {
      socketIO: io.engine.clientsCount,
      webSocket: wss.clients.size,
    },
  }),
}

// بدء الخادم
server.listen(PORT, "0.0.0.0", () => {
  console.log(`
🚀 WhatsApp Manager WebSocket Server v${systemStats.version}
📡 Socket.IO + WebSocket Server running on port ${PORT}
🐧 Ubuntu 24.04 LTS Support: ✅
🌐 Environment: ${NODE_ENV}
📊 Health Check: http://localhost:${PORT}/health
📈 Stats: http://localhost:${PORT}/stats
⏰ Started at: ${new Date().toISOString()}
  `)
})

module.exports = { server, io, wss, updateDeviceStatus, sendQRCode, notifyMessage }
