import { NextRequest, NextResponse } from "next/server";
import { getRouteUserAndOrg } from "@/lib/org";

export async function GET(_req: NextRequest) {
  const { user, orgId, supa } = await getRouteUserAndOrg();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!orgId) return NextResponse.json({ ok: false, error: "No organization" }, { status: 400 });

  const { data: zonesData, error: zErr } = await supa
    .from("zones")
    .select("id, name, district_id, activation_id, organization_id")
    .eq("organization_id", orgId)
    .order("name", { ascending: true });

  if (zErr) return NextResponse.json({ ok: false, error: zErr.message }, { status: 400 });

  const zones = Array.isArray(zonesData) ? zonesData : [];

  const districtIds = Array.from(
    new Set(
      zones
        .map((z: any) => z.district_id)
        .filter((v: unknown): v is string => typeof v === "string")
    )
  );
  const activationIds = Array.from(
    new Set(
      zones
        .map((z: any) => z.activation_id)
        .filter((v: unknown): v is string => typeof v === "string")
    )
  );

  const districtsById = new Map<string, { id: string; name: string }>();
  if (districtIds.length) {
    const { data: dData } = await supa
      .from("districts")
      .select("id, name, organization_id")
      .in("id", districtIds)
      .eq("organization_id", orgId);
    (Array.isArray(dData) ? dData : []).forEach((d: any) => districtsById.set(d.id, { id: d.id, name: d.name }));
  }

  const activationsById = new Map<string, { id: string; name: string }>();
  if (activationIds.length) {
    const { data: aData } = await supa
      .from("activations")
      .select("id, name, organization_id")
      .in("id", activationIds)
      .eq("organization_id", orgId);
    (Array.isArray(aData) ? aData : []).forEach((a: any) => activationsById.set(a.id, { id: a.id, name: a.name }));
  }

  const result = zones.map((z: any) => {
    const act = z.activation_id ? activationsById.get(z.activation_id) : undefined;
    const dist = z.district_id ? districtsById.get(z.district_id) : undefined;
    const labelParts: string[] = [];
    if (act?.name) labelParts.push(act.name);
    const dd = [dist?.name, z.name].filter(Boolean).join(" / ");
    if (dd) labelParts.push(dd);
    const label = labelParts.length ? labelParts.join(" – ") : z.name;
    return { id: z.id as string, label };
  });

  return NextResponse.json({ ok: true, zones: result });
}
