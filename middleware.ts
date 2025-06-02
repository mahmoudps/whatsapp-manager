import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// المسارات التي لا تتطلب مصادقة
const publicPaths = [
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/health",
  "/api/docs",
]

// المسارات التي تتطلب صلاحيات خاصة
const adminPaths = [
  "/admin",
  "/api/admin",
]

export function middleware(request: NextRequest) {
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

  if (!token) {
    // إعادة توجيه إلى صفحة تسجيل الدخول
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // التحقق البسيط من وجود التوكن (سيتم التحقق الكامل في API routes)
  if (!token || token.length < 10) {
    // إزالة التوكن غير الصحيح
    const response = pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Invalid token" }, { status: 401 })
      : NextResponse.redirect(new URL("/login", request.url))
    
    response.cookies.delete("auth-token")
    return response
  }

  return NextResponse.next()
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

