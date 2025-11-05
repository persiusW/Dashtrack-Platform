
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { customAlphabet } from "nanoid";

const nanoToken = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 21);

export async function POST() {
  const supa = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supa.auth.getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "No session" }, { status: 401 });
  }

  // Find latest activation
  const { data: act, error: actErr } = await supa
    .from("activations")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (actErr) {
    return NextResponse.json({ ok: false, error: actErr.message }, { status: 400 });
  }
  if (!act?.id) {
    return NextResponse.json({ ok: false, error: "No activation found" }, { status: 400 });
  }

  // Find a zone for that activation
  const { data: zone, error: zoneErr } = await supa
    .from("zones")
    .select("id, organization_id, activation_id")
    .eq("activation_id", act.id)
    .limit(1)
    .maybeSingle();

  if (zoneErr) {
    return NextResponse.json({ ok: false, error: zoneErr.message }, { status: 400 });
  }
  if (!zone?.id) {
    return NextResponse.json({ ok: false, error: "No zone found" }, { status: 400 });
  }

  // Create a temp agent (must include public_stats_token)
  const token = nanoToken();
  const { data: agent, error: agentErr } = await supa
    .from("agents")
    .insert({
      organization_id: zone.organization_id,
      name: `Diag Agent ${Date.now()}`,
      public_stats_token: token,
      active: true,
    })
    .select("id")
    .single();

  if (agentErr || !agent) {
    return NextResponse.json(
      { ok: false, stage: "agent", error: agentErr?.message || "Failed to insert agent" },
      { status: 400 }
    );
  }

  // Link it via zone_agents (schema does not include activation_id here)
  const { error: zaErr } = await supa.from("zone_agents").insert({
    organization_id: zone.organization_id,
    zone_id: zone.id,
    agent_id: agent.id,
  });
  if (zaErr) {
    // Best-effort cleanup of the agent if mapping failed
    await supa.from("agents").delete().eq("id", agent.id);
    return NextResponse.json(
      { ok: false, stage: "zone_agents", error: zaErr.message },
      { status: 400 }
    );
  }

  // Cleanup both (best effort)
  await supa.from("zone_agents").delete().eq("agent_id", agent.id);
  await supa.from("agents").delete().eq("id", agent.id);

  return NextResponse.json({ ok: true });
}
  