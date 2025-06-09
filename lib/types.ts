// في بداية الملف، أضف أنواعًا عامة لاستجابات API
export interface SuccessResponse<T = any> {
  success: true
  data: T
  message?: string
  timestamp: string
}

export interface ErrorResponse {
  success: false
  error: string
  details?: any
  timestamp: string
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse

export interface Device {
  id: number
  name: string
  phoneNumber?: string
  status: "disconnected" | "connecting" | "qr_ready" | "connected" | "error" | "auth_failed"
  qrCode?: string
  lastSeen?: string
  createdAt: string
  updatedAt: string
  errorMessage?: string
  connectionAttempts: number
}

export type DeviceStatus = "disconnected" | "connecting" | "qr_ready" | "connected" | "error" | "auth_failed"

export interface Message {
  id: number
  deviceId: number
  recipient: string
  message: string
  status: "pending" | "sent" | "failed" | "scheduled"
  sentAt?: string
  scheduledAt?: string
  errorMessage?: string
  messageType: MessageType
  mediaUrl?: string
  deliveredAt?: string
}

export type MessageStatus = "pending" | "sent" | "delivered" | "failed" | "scheduled"
export type MessageType = "text" | "image" | "video" | "audio" | "document"

export interface IncomingMessage {
  id: number
  deviceId: number
  sender: string
  message: string
  messageId: string
  messageType: MessageType
  mediaUrl?: string
  receivedAt: string
}

export interface Admin {
  id: number
  username: string
  passwordHash: string
  lastLogin?: string
  loginAttempts: number
  lockedUntil?: string
  createdAt: string
  isActive: boolean
}

// أنواع البيانات المشتركة

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  page: number
  limit: number
  total: number
  hasMore: boolean
}

export interface DeviceStatusInfo {
  id: number
  name: string
  status: "disconnected" | "connecting" | "qr_ready" | "connected" | "error"
  phoneNumber?: string
  qrCode?: string
  lastSeen?: string
  errorMessage?: string
}

export interface MessageRequest {
  recipient: string
  message: string
  deviceId: number
}

export interface BulkMessageRequest {
  recipients: string[]
  message: string
  deviceId: number
  delayBetweenMessages?: number
}

export interface WebSocketMessage {
  type: string
  data: any
}

export interface WebSocketEvent {
  event: string
  data: any
}

export interface SystemStats {
  uptime: number
  memory: {
    total: number
    free: number
    used: number
    usedPercent: number
  }
  cpu: {
    loadAvg: number[]
    cores: number
  }
}

// ===== أنواع WhatsApp =====
export interface QRCodeData {
  deviceId: number
  qrCode: string
  timestamp: string
  expiresAt: string
}

export interface DeviceConnection {
  deviceId: number
  phoneNumber: string
  deviceInfo: WhatsAppDeviceInfo
  connectedAt: string
}

export interface WhatsAppDeviceInfo {
  platform: string
  pushname: string
  wid: string
}

// ===== أنواع النظام =====

export interface HealthStatus {
  status: "healthy" | "unhealthy" | "degraded"
  timestamp: string
  uptime: number
  memory: NodeJS.MemoryUsage
  database: {
    connected: boolean
    responseTime?: number
  }
  whatsappClients: {
    total: number
    connected: number
    errors: number
  }
  services: Record<
    string,
    {
      status: "up" | "down"
      responseTime?: number
      lastCheck: string
    }
  >
}

// ===== أنواع المرشحات =====
export interface MessageFilters {
  deviceId?: number
  status?: MessageStatus
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
  search?: string
}

export interface DeviceFilters {
  status?: DeviceStatus
  search?: string
  limit?: number
  offset?: number
}

// ===== أنواع المصادقة =====
export interface AuthUser {
  id: number
  username: string
  lastLogin?: string | null
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse extends ApiResponse {
  data?: {
    id: number
    username: string
    lastLogin?: string
  }
  token?: string
}

// ===== أنواع العمليات =====
export interface DatabaseOperations {
  // عمليات الأجهزة
  createDevice: (data: Partial<Device>) => Promise<{ data: Device | null; error: string | null }>
  getDevice: (id: number) => Promise<{ data: Device | null; error: string | null }>
  getDevices: (filters?: DeviceFilters) => Promise<{ data: Device[]; error: string | null }>
  updateDevice: (id: number, data: Partial<Device>) => Promise<{ data: Device | null; error: string | null }>
  deleteDevice: (id: number) => Promise<{ error: string | null }>

  // عمليات الرسائل
  createMessage: (data: Partial<Message>) => Promise<{ data: Message | null; error: string | null }>
  getMessage: (id: number) => Promise<{ data: Message | null; error: string | null }>
  getMessages: (filters?: MessageFilters) => Promise<{ data: Message[]; error: string | null }>
  updateMessage: (id: number, data: Partial<Message>) => Promise<{ data: Message | null; error: string | null }>
  deleteMessage: (id: number) => Promise<{ error: string | null }>

  // عمليات الرسائل الواردة
  createIncomingMessage: (
    data: Partial<IncomingMessage>,
  ) => Promise<{ data: IncomingMessage | null; error: string | null }>
  getIncomingMessages: (filters?: MessageFilters) => Promise<{ data: IncomingMessage[]; error: string | null }>

  // عمليات المستخدمين
  getUserByUsername: (username: string) => Promise<{ data: Admin | null; error: string | null }>
  updateUserLastLogin: (id: number) => Promise<void> | void

  // إحصائيات النظام
  getSystemStats: () => Promise<{ data: SystemStats | null; error: string | null }>
}

// ===== أنواع الأحداث =====
export interface DeviceEvent extends WebSocketEvent {
  type: "device:qr" | "device:connected" | "device:disconnected" | "device:error"
  data: {
    deviceId: number
    [key: string]: any
  }
}

export interface MessageEvent extends WebSocketEvent {
  type: "message:incoming" | "message:sent" | "message:failed"
  data: {
    deviceId: number
    messageId?: number
    [key: string]: any
  }
}

// ===== أنواع التكوين =====
export interface AppConfig {
  database: {
    path: string
    backupInterval: number
  }
  whatsapp: {
    maxConnectionAttempts: number
    connectionTimeout: number
    qrTimeout: number
    messageDelay: number
  }
  security: {
    jwtExpiry: string
    rateLimits: {
      general: { window: number; max: number }
      auth: { window: number; max: number }
      messages: { window: number; max: number }
    }
  }
  logging: {
    level: "debug" | "info" | "warn" | "error"
    maxFiles: number
    maxSize: string
  }
}

// ===== أنواع الأخطاء =====
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode = 500,
    public details?: any,
  ) {
    super(message)
    this.name = "AppError"
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, "VALIDATION_ERROR", 400, details)
    this.name = "ValidationError"
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication failed") {
    super(message, "AUTH_ERROR", 401)
    this.name = "AuthenticationError"
  }
}

export class WhatsAppError extends AppError {
  constructor(message: string, details?: any) {
    super(message, "WHATSAPP_ERROR", 500, details)
    this.name = "WhatsAppError"
  }
}

// إضافة نوع لـ User في AuthContext إذا لم يكن موجودًا بشكل واضح
export interface UserContextType {
  id: number // أو string حسب قاعدة البيانات
  username: string
  // أضف أي حقول أخرى ضرورية مثل الأدوار، إلخ.
}

export interface NotificationData {
  id: string
  type: "success" | "error" | "warning" | "info"
  title: string
  message: string
  timestamp: number
}
