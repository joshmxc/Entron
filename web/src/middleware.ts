import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/_next", "/api", "/icons", "/sounds", "/manifest.json", "/sw.js", "/favicon.ico"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // Always ensure locale cookie is set
  if (!req.cookies.get("NEXT_LOCALE")) {
    response.cookies.set("NEXT_LOCALE", "sw", { path: "/", maxAge: 60 * 60 * 24 * 365 });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
