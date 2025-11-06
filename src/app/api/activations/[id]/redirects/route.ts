import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const supa = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { default_redirect_url, redirect_android_url, redirect_ios_url } = body || {};

  const { error } = await supa
    .from("activations")
    .update({
      default_redirect_url,
      redirect_android_url: redirect_android_url || null,
      redirect_ios_url: redirect_ios_url || null,
    })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
