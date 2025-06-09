import { NextResponse, type NextRequest } from "next/server"
import { AuthService } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const refreshToken = request.cookies.get("refresh-token")?.value || body?.refreshToken

  if (!refreshToken) {
    return NextResponse.json({ success: false, message: "Refresh token missing" }, { status: 401 })
  }

  const tokens = await AuthService.refreshAccessToken(refreshToken)
  if (!tokens) {
    return NextResponse.json({ success: false, message: "Invalid refresh token" }, { status: 401 })
  }

  const response = NextResponse.json({ success: true, token: tokens.accessToken })
  response.cookies.set("auth-token", tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  })
  response.cookies.set("refresh-token", tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  })
  return response
}
