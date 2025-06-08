import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import os from "os"
import fs from "fs"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    // التحقق من المصادقة
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // جمع معلومات النظام
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      uptime: os.uptime(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpus: os.cpus().length,
      loadAverage: os.loadavg(),
      hostname: os.hostname(),
      networkInterfaces: Object.keys(os.networkInterfaces()),
    }

    // معلومات التطبيق
    const appInfo = {
      processUptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      pid: process.pid,
      cwd: process.cwd(),
    }

    // معلومات قاعدة البيانات
    const dbPath = process.env.DATABASE_PATH || "./data/whatsapp_manager.db"
    let dbInfo = null
    try {
      const stats = fs.statSync(dbPath)
      dbInfo = {
        exists: true,
        size: stats.size,
        modified: stats.mtime,
      }
    } catch (error) {
      dbInfo = {
        exists: false,
        error: "Database file not found",
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        system: systemInfo,
        application: appInfo,
        database: dbInfo,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("System stats error:", error)
    return NextResponse.json({ error: "Failed to get system stats" }, { status: 500 })
  }
}
