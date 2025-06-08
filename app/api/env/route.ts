export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import {
  PORT,
  WHATSAPP_SERVER_PORT,
  WEBSOCKET_PORT,
  ENABLE_WEBSOCKET,
  DATABASE_PATH,
} from "@/lib/config"

export async function GET() {
  try {
    return NextResponse.json({
      PORT,
      WHATSAPP_SERVER_PORT,
      WEBSOCKET_PORT,
      ENABLE_WEBSOCKET,
      DATABASE_PATH,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
