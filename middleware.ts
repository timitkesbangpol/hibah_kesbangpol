import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Izinkan request untuk login, api, file internal Next.js, dan aset statis
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Jika membuka halaman utama ("/") atau halaman portal apapun tanpa sesi login
  const sessionToken = request.cookies.get("kesbangpol_session")?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Mencegat seluruh halaman kecuali aset statis dan API
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
