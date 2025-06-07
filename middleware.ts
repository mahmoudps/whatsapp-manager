import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// المسارات التي لا تتطلب مصادقة
const publicPaths = ["/login", "/api/auth/login", "/api/auth/logout", "/api/health", "/api/docs"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // السماح بالمسارات العامة
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // السماح بالملفات الثابتة
  if (pathname.startsWith("/_next") || pathname.startsWith("/static") || pathname.startsWith("/favicon")) {
    return NextResponse.next()
  }

  // فحص وجود التوكن فقط (بدون التحقق من صحته هنا)
  const token = request.cookies.get("auth-token")?.value

  if (!token) {
    // إذا كان API route، أرجع 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    // إذا كان صفحة، أعد توجيه إلى صفحة تسجيل الدخول
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // السماح بالمرور إذا كان هناك توكن (سيتم التحقق من صحته في API routes)
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
