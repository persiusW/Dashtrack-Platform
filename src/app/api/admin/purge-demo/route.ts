
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST() {
  const supa = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supa.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // Delete tracked links that look like demo/sample by notes or slug
  // This is safe and does not require pre-selects.
  await supa
    .from("tracked_links")
    .delete()
    .or("notes.ilike.Demo%,notes.ilike.Sample%,slug.ilike.demo%,slug.ilike.sample%");

  // Clean zone_agents for demo agents
  const { data: demoAgents } = await supa
    .from("agents")
    .select("id")
    .or("name.ilike.Demo%,name.ilike.Sample%");
  const agentIds = (demoAgents || []).map((a: any) => a.id);
  if (agentIds.length > 0) {
    await supa.from("zone_agents").delete().in("agent_id", agentIds);
  }

  // Clean zone_agents for demo zones
  const { data: demoZones } = await supa
    .from("zones")
    .select("id")
    .or("name.ilike.Demo%,name.ilike.Sample%");
  const zoneIds = (demoZones || []).map((z: any) => z.id);
  if (zoneIds.length > 0) {
    await supa.from("zone_agents").delete().in("zone_id", zoneIds);
  }

  // Delete demo agents
  await supa.from("agents").delete().or("name.ilike.Demo%,name.ilike.Sample%");

  // Delete demo zones
  await supa.from("zones").delete().or("name.ilike.Demo%,name.ilike.Sample%");

  // Delete demo activations last (cascades will handle dependent rows)
  await supa.from("activations").delete().or("name.ilike.Demo%,name.ilike.Sample%");

  return NextResponse.json({ ok: true, message: "Demo rows purged (patterns: Demo% | Sample%)" });
}
  