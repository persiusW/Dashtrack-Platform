import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  const p = req.nextUrl.pathname;
  const isApp = p.startsWith("/app");
  const isAuth = p === "/login" || p === "/signup";

  if (isApp && !session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", p);
    return NextResponse.redirect(url);
  }

  if (isAuth && session) {
    const url = req.nextUrl.clone();
    url.pathname = "/app/overview";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/app/:path*", "/login", "/signup"]
};