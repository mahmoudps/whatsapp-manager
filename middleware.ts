import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken, AuthService } from "@/lib/auth"

// المسارات التي لا تتطلب مصادقة
const publicPaths = [
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/refresh",
  "/api/health",
  "/api/docs",
]

// المسارات التي تتطلب صلاحيات خاصة
const adminPaths = [
  "/admin",
  "/api/admin",
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // السماح بالمسارات العامة
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // السماح بالملفات الثابتة
  if (pathname.startsWith("/_next") || pathname.startsWith("/static")) {
    return NextResponse.next()
  }

  // فحص التوكن
  const token = request.cookies.get("auth-token")?.value

  if (token) {
    const decoded = verifyToken(token)
    if (decoded.valid) {
      return NextResponse.next()
    }
  }

  // محاولة استخدام رمز التحديث
  const refreshToken = request.cookies.get("refresh-token")?.value
  if (refreshToken) {
    const newTokens = await AuthService.refreshAccessToken(refreshToken)
    if (newTokens) {
      const response = NextResponse.next()
      response.cookies.set("auth-token", newTokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })
      response.cookies.set("refresh-token", newTokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })
      return response
    }
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return NextResponse.redirect(new URL("/login", request.url))
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}

