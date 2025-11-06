
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

function detectPlatform(ua: string) {
  const s = ua.toLowerCase();
  const isAndroid = s.includes("android");
  const isIOS = /iphone|ipad|ipod/.test(s);
  return { isAndroid, isIOS };
}

export async function GET(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;

  const supa = createRouteHandlerClient({ cookies });
  const ua = req.headers.get("user-agent") || "";
  const { isAndroid, isIOS } = detectPlatform(ua);

  const { data: link } = await supa
    .from("tracked_links")
    .select("slug, destination_strategy, single_url, fallback_url, is_active, activation_id")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!link) {
    return NextResponse.redirect("/", { status: 302 });
  }

  const { data: act } = await supa
    .from("activations")
    .select("default_redirect_url, default_landing_url")
    .eq("id", (link as any).activation_id)
    .maybeSingle();

  let linkRedirect: string | undefined;
  const strategy = (link as any).destination_strategy as string | null;
  if (strategy === "single") {
    linkRedirect = ((link as any).single_url as string | null) || undefined;
  } else {
    linkRedirect = ((link as any).fallback_url as string | null) || undefined;
  }

  const dest =
    (isAndroid && (act as any)?.redirect_android_url) ||
    (isIOS && (act as any)?.redirect_ios_url) ||
    linkRedirect ||
    (act?.default_redirect_url || act?.default_landing_url) ||
    "/";

  return NextResponse.redirect(dest, { status: 302 });
}
  