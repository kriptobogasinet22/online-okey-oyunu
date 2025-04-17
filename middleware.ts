import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // Oturumu kontrol et
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Ana sayfa ve auth sayfaları için middleware kontrolü yapma
  if (
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/api/")
  ) {
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
