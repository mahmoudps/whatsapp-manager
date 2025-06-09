import { createServer } from "http"
import { Server } from "socket.io"
import jwt from "jsonwebtoken"
import * as logger from "./logger"
import { JWT_SECRET } from "./config"

interface WebSocketServerInstance {
  io: Server | null
  server: any
  isRunning: boolean
}

let wsServerInstance: WebSocketServerInstance = {
  io: null,
  server: null,
  isRunning: false,
}

export function initializeWebSocketServer(port = 3001): WebSocketServerInstance {
  if (wsServerInstance.isRunning) {
    logger.info("WebSocket server already running")
    return wsServerInstance
  }

  try {
    const server = createServer()
    const io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "https://wa-api.developments.world",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
    })

    // Authentication middleware
    io.use((socket, next) => {
      const token =
        socket.handshake.auth.token ||
        (socket.handshake.headers.authorization && socket.handshake.headers.authorization.replace("Bearer ", ""))

      if (!token) {
        logger.warn("Socket connection without token")
        return next() // Allow connection without auth for development
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET)
        socket.user = decoded
        logger.info(`✅ Authenticated socket user: ${(decoded as any).username}`)
      } catch (error) {
        logger.warn("Invalid token for socket connection")
      }

      next()
    })

    // Connection handling
    io.on("connection", (socket) => {
      logger.info(`✅ Socket client connected: ${socket.id}`)

      socket.emit("connected", {
        clientId: socket.id,
        serverId: "whatsapp-manager-ws",
        timestamp: new Date().toISOString(),
      })

      socket.on("join_device", (deviceId: string) => {
        if (deviceId) {
          socket.join(`device_${deviceId}`)
          logger.info(`📱 Socket client ${socket.id} joined device room: ${deviceId}`)
        }
      })

      socket.on("leave_device", (deviceId: string) => {
        if (deviceId) {
          socket.leave(`device_${deviceId}`)
          logger.info(`📱 Socket client ${socket.id} left device room: ${deviceId}`)
        }
      })

      socket.on("ping", () => {
        socket.emit("pong", { timestamp: new Date().toISOString() })
      })

      socket.on("disconnect", (reason) => {
        logger.info(`❌ Socket client disconnected: ${socket.id} (${reason})`)
      })

      socket.on("error", (error) => {
        logger.error(`🚨 Socket error for client ${socket.id}:`, error)
      })
    })

    server.listen(port, () => {
      logger.info(`🚀 WebSocket Server running on port ${port}`)
    })

    wsServerInstance = {
      io,
      server,
      isRunning: true,
    }

    return wsServerInstance
  } catch (error) {
    logger.error("Failed to initialize WebSocket server:", error)
    return wsServerInstance
  }
}

export function getWebSocketServer(): WebSocketServerInstance {
  return wsServerInstance
}

export function stopWebSocketServer(): void {
  if (wsServerInstance.isRunning && wsServerInstance.server) {
    wsServerInstance.server.close()
    wsServerInstance.isRunning = false
    logger.info("WebSocket server stopped")
  }
}

const websocketApi = {
  initializeWebSocketServer,
  getWebSocketServer,
  stopWebSocketServer,
}

export default websocketApi
