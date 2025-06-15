import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { verifyAuth, buildUnauthorizedResponse } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return buildUnauthorizedResponse(authResult)
    }

    // Ensure the database is initialized before querying
    await db.ensureInitialized()

    const url = new URL(request.url)
    const limit = Number.parseInt(url.searchParams.get("limit") || "50")
    const offset = Number.parseInt(url.searchParams.get("offset") || "0")

    const events = await db.getAnalyticsEvents(limit, offset)
    const summary = await db.getAnalyticsSummary()

    return NextResponse.json({
      success: true,
      events,
      summary,
      count: events.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "خطأ في جلب التحليلات",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
