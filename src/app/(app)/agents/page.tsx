import PageHeader from "@/components/dashboard/PageHeader";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import AgentsClient from "./AgentsClient";

type Agent = {
  id: string;
  name: string;
  notes?: string | null;
  created_at: string | null;
  zone_id?: string | null;
};

type TrackedLinkLite = {
  id: string;
  agent_id: string | null;
  slug: string;
  activation_id: string | null;
  zone_id: string | null;
  redirect_url: string | null;
  created_at?: string | null;
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

export interface AgentListRow {
  id: string;
  name: string;
  notes: string;
  activationName: string;
  districtName: string;
  zoneName: string;
  linkId?: string;
  slug?: string;
  shortUrl?: string;
  absoluteUrl?: string;
  redirectUrl?: string;
}

export default async function AgentsPage() {
  const supa = createServerComponentClient({ cookies });
  const {
    data: { user },
  } = await supa.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <PageHeader icon="users" title="Agents" subtitle="Manage field agents and their unique links" />
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Please sign in to view agents.
        </div>
      </div>
    );
  }

  const { data: profile } = await supa
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();

  const orgId = (profile as any)?.organization_id as string | undefined;

  if (!orgId) {
    return (
      <div className="space-y-6">
        <PageHeader icon="users" title="Agents" subtitle="Manage field agents and their unique links" />
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          No organization found. Create your organization in Settings first.
        </div>
      </div>
    );
  }

  const { data: agentsData } = await supa
    .from("agents")
    .select("id, name, notes, created_at, zone_id, organization_id")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  const agents: Agent[] = Array.isArray(agentsData) ? (agentsData as Agent[]) : [];

  if (!agents.length) {
    return (
      <div className="space-y-6">
        <PageHeader icon="users" title="Agents" subtitle="Manage field agents and their unique links" />
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          No agents yet.
        </div>
      </div>
    );
  }

  const agentIds = agents.map((a) => a.id);

  const linksByAgent = new Map<string, TrackedLinkLite>();
  if (agentIds.length) {
    const { data: linksData } = await supa
      .from("tracked_links")
      .select("id, agent_id, slug, activation_id, zone_id, redirect_url, created_at, is_active, organization_id")
      .in("agent_id", agentIds)
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    const linksArr = (Array.isArray(linksData) ? linksData : []) as Array<TrackedLinkLite & { is_active?: boolean }>;
    for (const row of linksArr) {
      const aid = row.agent_id || "";
      if (!aid) continue;
      if (!linksByAgent.has(aid)) {
        linksByAgent.set(aid, {
          id: row.id,
          agent_id: row.agent_id,
          slug: row.slug,
          activation_id: row.activation_id,
          zone_id: row.zone_id,
          redirect_url: row.redirect_url ?? null,
          created_at: row.created_at,
        });
      }
    }
  }

  const linkZoneIds = Array.from(linksByAgent.values())
    .map((l) => l.zone_id)
    .filter((v): v is string => Boolean(v));

  const agentZoneIds = agents
    .map((a) => a.zone_id)
    .filter((v): v is string => Boolean(v));

  const zoneIdsSet = new Set<string>([...linkZoneIds, ...agentZoneIds]);
  const zoneIds = Array.from(zoneIdsSet);

  const linkActivationIds = Array.from(linksByAgent.values())
    .map((l) => l.activation_id)
    .filter((v): v is string => Boolean(v));

  const zonesById = new Map<string, ZoneLite>();
  if (zoneIds.length) {
    const { data: zonesData } = await supa
      .from("zones")
      .select("id, name, district_id, activation_id, organization_id")
      .in("id", zoneIds)
      .eq("organization_id", orgId);

    const zones = (Array.isArray(zonesData) ? zonesData : []) as ZoneLite[];
    for (const z of zones) {
      zonesById.set(z.id, z);
    }
  }

  const districtIds = Array.from(zonesById.values())
    .map((z) => z.district_id)
    .filter((v): v is string => Boolean(v));

  const zoneActivationIds = Array.from(zonesById.values())
    .map((z) => z.activation_id)
    .filter((v): v is string => Boolean(v));

  const activationIdSet = new Set<string>([...linkActivationIds, ...zoneActivationIds]);
  const activationIds = Array.from(activationIdSet);

  const districtsById = new Map<string, DistrictLite>();
  if (districtIds.length) {
    const { data: districtsData } = await supa
      .from("districts")
      .select("id, name, organization_id")
      .in("id", districtIds)
      .eq("organization_id", orgId);

    const districts = (Array.isArray(districtsData) ? districtsData : []) as DistrictLite[];
    for (const d of districts) {
      districtsById.set(d.id, d);
    }
  }

  const activationsById = new Map<string, ActivationLite>();
  if (activationIds.length) {
    const { data: activationsData } = await supa
      .from("activations")
      .select("id, name, organization_id")
      .in("id", activationIds)
      .eq("organization_id", orgId);

    const activations = (Array.isArray(activationsData) ? activationsData : []) as ActivationLite[];
    for (const a of activations) {
      activationsById.set(a.id, a);
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  const toShort = (slug: string) => `/r/${slug}`;
  const toAbsolute = (slug: string) => {
    const short = toShort(slug);
    return baseUrl ? `${baseUrl}${short}` : short;
  };

  const rows = agents.map((a) => {
    const link = linksByAgent.get(a.id);

    const zoneId = (link?.zone_id as string | undefined) || (a.zone_id as string | undefined);
    const zone = zoneId ? zonesById.get(zoneId) : undefined;
    const district = zone?.district_id ? districtsById.get(zone.district_id) : undefined;

    const activationId = (link?.activation_id as string | undefined) || (zone?.activation_id as string | undefined);
    const activation = activationId ? activationsById.get(activationId) : undefined;

    const activationName = activation?.name || "";
    const districtName = district?.name || "";
    const zoneName = zone?.name || "";

    const slug = link?.slug || undefined;
    const shortUrl = slug ? toShort(slug) : undefined;
    const absoluteUrl = slug ? toAbsolute(slug) : undefined;
    const redirectUrl = link?.redirect_url ?? undefined;

    return {
      id: a.id,
      name: a.name,
      notes: a.notes ?? "",
      activationName,
      districtName,
      zoneName,
      linkId: link?.id,
      slug,
      shortUrl,
      absoluteUrl,
      redirectUrl,
    } as AgentListRow;
  });

  return (
    <div className="space-y-6">
      <PageHeader icon="users" title="Agents" subtitle="Manage field agents and their unique links" />
      <AgentsClient rows={rows} />
    </div>
  );
}
