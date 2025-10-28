
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // If user is trying to access app routes without a session, redirect to login
  if (!session && pathname.startsWith("/app")) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set(`next`, pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user has a session and tries to access login/signup, redirect to overview
  if (session && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/app/overview", req.url));
  }
  
  // If user is authenticated and at /app, redirect to /app/overview
  if (session && pathname === '/app') {
    return NextResponse.redirect(new URL('/app/overview', req.url))
  }

  return res;
}

export const config = {
  matcher: ["/app/:path*", "/login", "/signup", "/app"],
};
