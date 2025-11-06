import PageHeader from "@/components/dashboard/PageHeader";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";

type Agent = {
  id: string;
  name: string;
  organization_id: string;
  zone_id?: string | null;
};

type TrackedLinkLite = {
  id: string;
  slug: string;
  activation_id: string | null;
  zone_id: string | null;
};

type ZoneLite = {
  id: string;
  name: string;
  district_id: string | null;
  activation_id: string | null;
};

type DistrictLite = {
  id: string;
  name: string;
};

type ActivationLite = {
  id: string;
  name: string;
};

type ClickLite = {
  created_at: string;
  device_type: string | null;
  referrer: string | null;
  is_bot?: boolean;
};

function toDateKeyUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isoAtUTCStartOfDay(daysFromToday: number): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + daysFromToday);
  return d.toISOString();
}

export default async function AgentDetailPage({ params }: { params: { id: string } }) {
  const supa = createServerComponentClient({ cookies });

  const {
    data: { user },
  } = await supa.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <PageHeader icon="users" title="Agent" subtitle="View agent details and performance" />
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Please sign in to view this agent.
        </div>
      </div>
    );
  }

  // Get organization_id for current user
  const { data: profile } = await supa
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();

  const orgId = (profile as any)?.organization_id as string | undefined;

  if (!orgId) {
    return (
      <div className="space-y-6">
        <PageHeader icon="users" title="Agent" />
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          No organization found. Create your organization in Settings first.
        </div>
      </div>
    );
  }

  // Load agent restricted to organization
  const { data: agent } = await supa
    .from("agents")
    .select("id, name, organization_id, zone_id")
    .eq("id", params.id)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!agent) {
    return (
      <div className="space-y-6">
        <PageHeader icon="users" title="Agent" />
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Agent not found.
        </div>
        <div>
          <Link href="/agents" className="btn-press rounded border px-3 py-1.5 text-sm hover:bg-gray-50">
            Back to Agents
          </Link>
        </div>
      </div>
    );
  }

  // Latest active tracked link for this agent
  const { data: link } = await supa
    .from("tracked_links")
    .select("id, slug, activation_id, zone_id, organization_id")
    .eq("agent_id", agent.id)
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let zone: ZoneLite | null = null;
  let district: DistrictLite | null = null;
  let activation: ActivationLite | null = null;

  const zoneId = (link?.zone_id as string | null) ?? (agent.zone_id as string | null) ?? null;

  if (zoneId) {
    const { data: z } = await supa
      .from("zones")
      .select("id, name, district_id, activation_id, organization_id")
      .eq("id", zoneId)
      .eq("organization_id", orgId)
      .maybeSingle();
    zone = (z as ZoneLite) || null;

    if (zone?.district_id) {
      const { data: d } = await supa
        .from("districts")
        .select("id, name, organization_id")
        .eq("id", zone.district_id)
        .eq("organization_id", orgId)
        .maybeSingle();
      district = (d as DistrictLite) || null;
    }
  }

  const activationId = (link?.activation_id as string | null) || (zone?.activation_id as string | null) || null;
  if (activationId) {
    const { data: a } = await supa
      .from("activations")
      .select("id, name, organization_id")
      .eq("id", activationId)
      .eq("organization_id", orgId)
      .maybeSingle();
    activation = (a as ActivationLite) || null;
  }

  const parts: string[] = [];
  if (activation?.name) parts.push(activation.name);
  const districtZone = [district?.name, zone?.name].filter(Boolean).join(" / ");
  if (districtZone) parts.push(districtZone);
  const desc = parts.length ? parts.join(" – ") : "—";

  // Metrics: last 7 days (valid clicks = !is_bot)
  // Window: from UTC start (today - 6) to UTC start (tomorrow)
  const startISO = isoAtUTCStartOfDay(-6);
  const tomorrowISO = isoAtUTCStartOfDay(1);

  const { count: weekValidCount } = await supa
    .from("clicks")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", agent.id)
    .eq("organization_id", orgId)
    .eq("is_bot", false)
    .gte("created_at", startISO)
    .lt("created_at", tomorrowISO);

  // Daily series for last 7 days (valid clicks)
  const { data: dailyRows } = await supa
    .from("clicks")
    .select("created_at")
    .eq("agent_id", agent.id)
    .eq("organization_id", orgId)
    .eq("is_bot", false)
    .gte("created_at", startISO)
    .lt("created_at", tomorrowISO);

  const dailyCountsMap = new Map<string, number>();
  if (Array.isArray(dailyRows)) {
    for (const r of dailyRows as ClickLite[]) {
      const dt = new Date(r.created_at);
      const key = toDateKeyUTC(dt);
      dailyCountsMap.set(key, (dailyCountsMap.get(key) || 0) + 1);
    }
  }

  const last7Keys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(isoAtUTCStartOfDay(-i));
    last7Keys.push(toDateKeyUTC(d));
  }
  const dailySeries = last7Keys.map((k) => ({ date: k, count: dailyCountsMap.get(k) || 0 }));

  // Recent clicks (limit 20; show all clicks)
  const { data: recentClicksData } = await supa
    .from("clicks")
    .select("created_at, device_type, referrer")
    .eq("agent_id", agent.id)
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(20);

  const recentClicks = (Array.isArray(recentClicksData) ? recentClicksData : []) as ClickLite[];

  return (
    <div className="space-y-6">
      <PageHeader icon="users" title={agent.name || "Agent"} subtitle={desc} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="text-sm text-gray-600">This week (last 7 days) – valid clicks</div>
          <div className="mt-2 text-3xl font-semibold">{weekValidCount ?? 0}</div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="text-sm text-gray-600">Last 7 days (daily)</div>
          <div className="mt-3 space-y-2">
            {dailySeries.map((d) => (
              <div key={d.date} className="flex items-center justify-between text-sm">
                <span className="font-mono text-gray-700">{d.date}</span>
                <span className="font-medium">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b bg-gray-50 px-4 py-3 text-sm font-medium">Recent clicks</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Timestamp (UTC)</th>
              <th className="px-4 py-3 font-medium">Device</th>
              <th className="px-4 py-3 font-medium">Referrer</th>
            </tr>
          </thead>
          <tbody>
            {recentClicks.map((c, idx) => {
              const ts = c.created_at ? new Date(c.created_at).toISOString().replace("T", " ").slice(0, 16) : "";
              const device = c.device_type || "unknown";
              const ref = c.referrer || "Direct";
              return (
                <tr key={`${ts}-${idx}`} className="border-t">
                  <td className="px-4 py-3 font-mono">{ts}</td>
                  <td className="px-4 py-3">{device}</td>
                  <td className="px-4 py-3">{ref}</td>
                </tr>
              );
            })}
            {recentClicks.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-gray-600" colSpan={3}>
                  No recent clicks
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
