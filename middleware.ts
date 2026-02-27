import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = req.nextUrl.pathname;
  const isAppRoute = pathname.startsWith("/app");
  const isAuthRoute = pathname === "/login" || pathname === "/signup";

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  if (isAppRoute && !session) {
    const url = new URL("/login", baseUrl);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && session) {
    const url = new URL("/app/overview", baseUrl);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/app/:path*", "/login", "/signup"],
};
