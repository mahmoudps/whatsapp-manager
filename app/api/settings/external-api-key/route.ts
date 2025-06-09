export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { db } from "@/lib/database"

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth.success) {
    return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 })
  }
  await db.ensureInitialized()
  const value = db.getSetting("external_api_key")
  return NextResponse.json({ success: true, value })
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth.success) {
    return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 })
  }
  const { value } = await request.json()
  if (!value || typeof value !== "string") {
    return NextResponse.json({ success: false, error: "قيمة غير صالحة" }, { status: 400 })
  }
  await db.ensureInitialized()
  db.setSetting("external_api_key", value)
  return NextResponse.json({ success: true })
}
