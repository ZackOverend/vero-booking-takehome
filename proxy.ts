import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  const session = request.cookies.get("admin_session")?.value;
  const password = process.env.ADMIN_PASSWORD;

  if (!session || !password) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const encoder = new TextEncoder();
  const a = encoder.encode(session);
  const b = encoder.encode(password);
  const valid =
    a.length === b.length && timingSafeEqual(a, b);

  if (!valid) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
