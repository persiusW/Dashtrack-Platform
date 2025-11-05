import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(_: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params;

  const supabase = createRouteHandlerClient({ cookies });

  const { data } = await supabase
    .from("tracked_links")
    .select("destination_strategy, single_url, fallback_url, is_active")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  let redirectUrl: string | null = null;
  if (data) {
    const strategy = (data as any).destination_strategy as string | null;
    if (strategy === "single") {
      redirectUrl = ((data as any).single_url as string) || null;
    } else {
      redirectUrl = ((data as any).fallback_url as string) || null;
    }
  }

  return NextResponse.redirect(redirectUrl || "/", { status: 302 });
}
