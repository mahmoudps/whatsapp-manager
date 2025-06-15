export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import cookie from "cookie"
import Tokens from "csrf"
import { logger } from "@/lib/logger"

const tokens = new Tokens()

export async function GET(request: NextRequest) {
  try {
    logger.info("\uD83D\uDD0D GET /api/csrf-token - Starting request")

    const cookies = cookie.parse(request.headers.get("cookie") || "")
    let secret = cookies["_csrf"]

    if (!secret) {
      secret = tokens.secretSync()
    }

    const token = tokens.create(secret)

    const response = NextResponse.json({ csrfToken: token })

    if (!cookies["_csrf"]) {
      response.headers.append(
        "Set-Cookie",
        cookie.serialize("_csrf", secret, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
        }),
      )
    }

    return response
  } catch (error) {
    logger.error("\u274C Error in GET /api/csrf-token:", error)
    return NextResponse.json(
      { error: "خطأ في توليد رمز CSRF" },
      { status: 500 },
    )
  }
}
