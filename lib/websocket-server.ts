import { createServer } from "http"
import { Server } from "socket.io"
import express from "express"
import cors from "cors"
import helmet from "helmet"
import compression from "compression"
import jwt from "jsonwebtoken"
import { logger } from "./logger"
import { JWT_SECRET } from "./config"

// إعدادات البيئة
const PORT = process.env.WEBSOCKET_PORT || 3001
const NODE_ENV = process.env.NODE_ENV || "development"
const FRONTEND_URL = process.env.FRONTEND_URL || "https://wa-api.developments.world"

interface WebSocketServerInstance {
  server: any
  io: Server
  isRunning: boolean
  port: number
  stats: {
    startTime: Date
    totalConnections: number
    activeConnections: number
    messagesProcessed: number
    errors: number
  }
}

let wsServerInstance: WebSocketServerInstance | null = null

// إنشاء خادم WebSocket
export function initializeWebSocketServer(port: number = Number(PORT)): WebSocketServerInstance {
  if (wsServerInstance && wsServerInstance.isRunning) {
    logger.info("WebSocket server already running")
    return wsServerInstance
  }

  try {
    logger.info(`Initializing WebSocket server on port ${port}`)

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
        origin: [FRONTEND_URL, "https://wa-api.developments.world"],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      }),
    )

    app.use(express.json({ limit: "10mb" }))

    // إعداد Socket.IO
    const io = new Server(server, {
      cors: {
        origin: [FRONTEND_URL, "https://wa-api.developments.world"],
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
      allowEIO3: true,
      pingTimeout: 60000,
      pingInterval: 25000,
      upgradeTimeout: 30000,
      maxHttpBufferSize: 1e8,
    })

    // إحصائيات النظام
    const stats = {
      startTime: new Date(),
      totalConnections: 0,
      activeConnections: 0,
      messagesProcessed: 0,
      errors: 0,
    }

    // متغيرات النظام
    const connectedClients = new Map()
    const deviceStatuses = new Map()

    // دوال مساعدة
    function generateClientId() {
      return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    function verifyToken(token: string) {
      try {
        return jwt.verify(token, JWT_SECRET)
      } catch (error) {
        return null
      }
    }

    function broadcastToAll(event: string, data: any) {
      const message = {
        event,
        data,
        timestamp: new Date().toISOString(),
      }

      io.emit(event, data)
      stats.messagesProcessed++
    }

    function broadcastToDevice(deviceId: number, event: string, data: any) {
      const message = {
        event,
        data,
        deviceId,
        timestamp: new Date().toISOString(),
      }

      io.to(`device_${deviceId}`).emit(event, data)
      stats.messagesProcessed++
    }

    // Middleware للمصادقة في Socket.IO
    io.use((socket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "")

      if (!token) {
        logger.warn("Socket.IO connection without token")
        return next() // السماح بالاتصال بدون مصادقة للتطوير
      }

      const decoded = verifyToken(token)
      if (decoded) {
        socket.user = decoded
        logger.info(`✅ Authenticated Socket.IO user: ${(decoded as any).id || (decoded as any).username}`)
      } else {
        logger.warn("Invalid token for Socket.IO connection")
      }

      next()
    })

    // معالجات Socket.IO
    io.on("connection", (socket) => {
      const clientId = generateClientId()
      stats.totalConnections++
      stats.activeConnections++

      logger.info(`✅ Socket.IO client connected: ${clientId} (${socket.id})`)

      // تسجيل العميل
      socket.clientId = clientId
      socket.connectedAt = new Date()

      // إرسال معلومات الاتصال
      socket.emit("connected", {
        clientId,
        serverId: "whatsapp-manager-ws",
        version: "9.0.0",
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
          logger.info(`📱 Socket.IO client ${clientId} joined device room: ${deviceId}`)

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
          logger.info(`📱 Socket.IO client ${clientId} left device room: ${deviceId}`)
        }
      })

      // طلب إحصائيات النظام
      socket.on("get_system_stats", () => {
        socket.emit("system_stats", {
          ...stats,
          uptime: Date.now() - stats.startTime.getTime(),
          connectedDevices: deviceStatuses.size,
          activeSocketConnections: io.engine.clientsCount,
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
        stats.activeConnections--
        logger.info(`❌ Socket.IO client disconnected: ${clientId} (${reason})`)
      })

      // معالج الأخطاء
      socket.on("error", (error) => {
        stats.errors++
        logger.error(`🚨 Socket.IO error for client ${clientId}:`, error)
      })
    })

    // API Routes للتحكم في WebSocket
    app.get("/", (req, res) => {
      res.json({
        service: "WhatsApp Manager WebSocket Server",
        version: "9.0.0",
        status: "running",
        uptime: Date.now() - stats.startTime.getTime(),
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
        version: "9.0.0",
        uptime: Date.now() - stats.startTime.getTime(),
        stats: {
          ...stats,
          socketIOConnections: io.engine.clientsCount,
          connectedDevices: deviceStatuses.size,
        },
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      })
    })

    app.get("/stats", (req, res) => {
      res.json({
        ...stats,
        uptime: Date.now() - stats.startTime.getTime(),
        connections: {
          socketIO: io.engine.clientsCount,
          total: io.engine.clientsCount,
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
        logger.error("Broadcast error:", error)
        res.status(500).json({ error: "Internal server error" })
      }
    })

    // دوال النظام العامة
    function updateDeviceStatus(deviceId: number, status: any) {
      deviceStatuses.set(deviceId, {
        ...status,
        lastUpdated: new Date().toISOString(),
      })

      broadcastToAll("device_status_changed", {
        deviceId,
        ...status,
      })
    }

    function sendQRCode(deviceId: number, qrCode: string) {
      broadcastToDevice(deviceId, "qr_code_generated", {
        deviceId,
        qrCode,
        timestamp: new Date().toISOString(),
      })
    }

    function notifyMessage(deviceId: number, messageData: any) {
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
          logger.info(`🧹 Cleaning up inactive client: ${clientId}`)
          connectedClients.delete(clientId)
          stats.activeConnections--
        }
      })
    }, 60000) // فحص كل دقيقة

    // إحصائيات دورية
    setInterval(() => {
      const statsData = {
        ...stats,
        uptime: Date.now() - stats.startTime.getTime(),
        connections: {
          socketIO: io.engine.clientsCount,
          total: io.engine.clientsCount,
        },
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      }

      broadcastToAll("system_stats", statsData)
    }, 30000) // كل 30 ثانية

    // بدء الخادم
    server.listen(port, "0.0.0.0", () => {
      logger.info(`🚀 WhatsApp Manager WebSocket Server v9.0.0`)
      logger.info(`📡 Socket.IO Server running on port ${port}`)
      logger.info(`🌐 Environment: ${NODE_ENV}`)
      logger.info(`📊 Health Check: http://localhost:${port}/health`)
      logger.info(`📈 Stats: http://localhost:${port}/stats`)
      logger.info(`⏰ Started at: ${new Date().toISOString()}`)
    })

    // إنشاء مثيل الخادم
    wsServerInstance = {
      server,
      io,
      isRunning: true,
      port,
      stats,
    }

    // تصدير الدوال للاستخدام الخارجي
    ;(global as any).wsServer = {
      updateDeviceStatus,
      sendQRCode,
      notifyMessage,
      broadcastToAll,
      broadcastToDevice,
      getStats: () => ({
        ...stats,
        uptime: Date.now() - stats.startTime.getTime(),
        connections: {
          socketIO: io.engine.clientsCount,
        },
      }),
    }

    // معالجة إشارات النظام
    process.on("SIGTERM", () => {
      logger.info("🛑 Received SIGTERM, shutting down gracefully...")
      server.close(() => {
        logger.info("✅ WebSocket server closed")
        if (wsServerInstance) {
          wsServerInstance.isRunning = false
        }
      })
    })

    process.on("SIGINT", () => {
      logger.info("🛑 Received SIGINT, shutting down gracefully...")
      server.close(() => {
        logger.info("✅ WebSocket server closed")
        if (wsServerInstance) {
          wsServerInstance.isRunning = false
        }
      })
    })

    return wsServerInstance
  } catch (error) {
    logger.error("Error initializing WebSocket server:", error)
    throw error
  }
}

// الحصول على مثيل الخادم الحالي
export function getWebSocketServer(): WebSocketServerInstance {
  if (!wsServerInstance || !wsServerInstance.isRunning) {
    return initializeWebSocketServer()
  }
  return wsServerInstance
}

// إيقاف الخادم
export function stopWebSocketServer(): void {
  if (wsServerInstance && wsServerInstance.isRunning) {
    wsServerInstance.server.close()
    wsServerInstance.isRunning = false
    wsServerInstance = null
    logger.info("WebSocket server stopped")
  }
}

export default {
  initializeWebSocketServer,
  getWebSocketServer,
  stopWebSocketServer,
}
