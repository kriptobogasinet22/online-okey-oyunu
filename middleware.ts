import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(request: NextRequest) {
  // Ana sayfaya erişimi her zaman izin ver
  if (request.nextUrl.pathname === "/") {
    return NextResponse.next()
  }

  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // Oturumu kontrol et
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Auth sayfaları ve API rotaları için middleware kontrolü yapma
  if (request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/api/")) {
    return res
  }

  // Oturum yoksa login sayfasına yönlendir
  if (!session && request.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return res
}

// Middleware'in çalışacağı rotaları belirt
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
