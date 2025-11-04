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

  if (isAppRoute && !session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && session) {
    const url = req.nextUrl.clone();
    url.pathname = "/app/overview";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/app/:path*", "/login", "/signup"],
};
