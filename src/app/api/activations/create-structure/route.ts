
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

type ZoneInput = { name: string };
type DistrictInput = { name: string; zones?: ZoneInput[] };

function isValidUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const u = new URL(value);
    return !!u.protocol && !!u.host;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const supa = createRouteHandlerClient({ cookies });

  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { data: profile, error: profileErr } = await supa
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileErr) {
    return NextResponse.json({ ok: false, error: profileErr.message }, { status: 400 });
  }
  if (!profile?.organization_id) {
    return NextResponse.json({ ok: false, error: "No organization" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const default_redirect_url = typeof body?.default_redirect_url === "string" ? body.default_redirect_url.trim() : "";
  const redirect_android_url = typeof body?.redirect_android_url === "string" ? body.redirect_android_url.trim() : "";
  const redirect_ios_url = typeof body?.redirect_ios_url === "string" ? body.redirect_ios_url.trim() : "";
  const districtsRaw = Array.isArray(body?.districts) ? (body?.districts as DistrictInput[]) : [];

  if (!name || !default_redirect_url) {
    return NextResponse.json({ ok: false, error: "name and default_redirect_url are required" }, { status: 400 });
  }
  if (!isValidUrl(default_redirect_url)) {
    return NextResponse.json({ ok: false, error: "default_redirect_url must be a valid URL" }, { status: 400 });
  }
  if (redirect_android_url && !isValidUrl(redirect_android_url)) {
    return NextResponse.json({ ok: false, error: "redirect_android_url must be a valid URL" }, { status: 400 });
  }
  if (redirect_ios_url && !isValidUrl(redirect_ios_url)) {
    return NextResponse.json({ ok: false, error: "redirect_ios_url must be a valid URL" }, { status: 400 });
  }

  const orgId = profile.organization_id;

  const { data: activation, error: aErr } = await supa
    .from("activations")
    .insert({
      organization_id: orgId,
      name,
      default_landing_url: default_redirect_url,
      redirect_android_url: redirect_android_url || null,
      redirect_ios_url: redirect_ios_url || null
    })
    .select("id, name, created_at")
    .single();

  if (aErr || !activation) {
    return NextResponse.json({ ok: false, error: aErr?.message || "Failed to create activation" }, { status: 400 });
  }

  const inputDistricts: DistrictInput[] =
    districtsRaw.length > 0 ? districtsRaw : [{ name: "Main District", zones: [{ name: "Zone 1" }] }];

  const districtRows = inputDistricts.map((d) => ({
    id: crypto.randomUUID(),
    organization_id: orgId,
    activation_id: activation.id,
    name: d.name,
  }));

  if (districtRows.length) {
    const { error: dErr } = await supa.from("districts").insert(districtRows);
    if (dErr) {
      return NextResponse.json({ ok: false, error: dErr.message }, { status: 400 });
    }
  }

  const zonesToInsert: { organization_id: string; activation_id: string; district_id: string; name: string }[] = [];
  for (let i = 0; i < districtRows.length; i++) {
    const src = inputDistricts[i];
    const dist = districtRows[i];
    const zones = src?.zones && src.zones.length > 0 ? src.zones : [{ name: "Zone 1" }];
    for (const z of zones) {
      zonesToInsert.push({
        organization_id: orgId,
        activation_id: activation.id,
        district_id: dist.id,
        name: z.name,
      });
    }
  }

  if (zonesToInsert.length) {
    const { error: zErr } = await supa.from("zones").insert(zonesToInsert);
    if (zErr) {
      return NextResponse.json({ ok: false, error: zErr.message }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true, activation_id: activation.id });
}
  