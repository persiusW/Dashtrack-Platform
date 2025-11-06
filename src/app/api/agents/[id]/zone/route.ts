
    import { NextRequest, NextResponse } from "next/server";
    import { getRouteUserAndOrg, agentInOrg, zoneInOrg } from "@/lib/org";

    export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
      const { id } = await context.params;
      const { user, orgId, supa } = await getRouteUserAndOrg();

      if (!user) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
      }
      if (!orgId) {
        return NextResponse.json({ ok: false, error: "No organization" }, { status: 400 });
      }

      const body = await req.json().catch(() => ({} as any));
      const zone_id = typeof body.zone_id === "string" ? body.zone_id.trim() : "";

      if (!zone_id) {
        return NextResponse.json({ ok: false, error: "zone_id required" }, { status: 400 });
      }

      const allowed = await agentInOrg(supa, id, orgId);
      if (!allowed) {
        return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
      }

      const zoneOk = await zoneInOrg(supa, zone_id, orgId);
      if (!zoneOk) {
        return NextResponse.json({ ok: false, error: "Invalid zone" }, { status: 403 });
      }

      const { error } = await supa
        .from("agents")
        .update({ zone_id })
        .eq("id", id)
        .eq("organization_id", orgId);

      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
      }

      return NextResponse.json({ ok: true });
    }
  