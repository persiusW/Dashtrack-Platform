
import PageHeader from "@/components/dashboard/PageHeader";
import CopyButton from "@/components/ui/CopyButton";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

type Agent = {
  id: string;
  name: string;
  created_at: string | null;
};

type TrackedLinkLite = {
  agent_id: string | null;
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

type AgentRow = {
  id: string;
  name: string;
  desc: string;
  slug?: string;
};

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
    .select("id, name, created_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  const agents: Agent[] = (Array.isArray(agentsData) ? agentsData : []) as Agent[];

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

  // Fetch latest active tracked link per agent (ordered by created_at desc)
  const linksByAgent = new Map<string, TrackedLinkLite>();
  if (agentIds.length) {
    const { data: linksData } = await supa
      .from("tracked_links")
      .select("agent_id, slug, activation_id, zone_id, created_at")
      .in("agent_id", agentIds)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    const linksArr = (Array.isArray(linksData) ? linksData : []) as Array<TrackedLinkLite & { created_at?: string | null }>;
    for (const row of linksArr) {
      const aid = row.agent_id || "";
      if (!aid) continue;
      if (!linksByAgent.has(aid)) {
        linksByAgent.set(aid, {
          agent_id: row.agent_id,
          slug: row.slug,
          activation_id: row.activation_id,
          zone_id: row.zone_id,
        });
      }
    }
  }

  // Collect zone/district/activation IDs
  const zoneIds = Array.from(linksByAgent.values())
    .map((l) => l.zone_id)
    .filter((v): v is string => Boolean(v));

  const linkActivationIds = Array.from(linksByAgent.values())
    .map((l) => l.activation_id)
    .filter((v): v is string => Boolean(v));

  // Fetch zones
  const zonesById = new Map<string, ZoneLite>();
  if (zoneIds.length) {
    const { data: zonesData } = await supa
      .from("zones")
      .select("id, name, district_id, activation_id")
      .in("id", zoneIds);

    const zones = (Array.isArray(zonesData) ? zonesData : []) as ZoneLite[];
    for (const z of zones) {
      zonesById.set(z.id, z);
    }
  }

  // From zones, collect districtIds and activationIds
  const districtIds = Array.from(zonesById.values())
    .map((z) => z.district_id)
    .filter((v): v is string => Boolean(v));

  const zoneActivationIds = Array.from(zonesById.values())
    .map((z) => z.activation_id)
    .filter((v): v is string => Boolean(v));

  // Combine activation IDs from links and zones
  const activationIdSet = new Set<string>([...linkActivationIds, ...zoneActivationIds]);
  const activationIds = Array.from(activationIdSet);

  // Fetch districts
  const districtsById = new Map<string, DistrictLite>();
  if (districtIds.length) {
    const { data: districtsData } = await supa
      .from("districts")
      .select("id, name")
      .in("id", districtIds);

    const districts = (Array.isArray(districtsData) ? districtsData : []) as DistrictLite[];
    for (const d of districts) {
      districtsById.set(d.id, d);
    }
  }

  // Fetch activations
  const activationsById = new Map<string, ActivationLite>();
  if (activationIds.length) {
    const { data: activationsData } = await supa
      .from("activations")
      .select("id, name")
      .in("id", activationIds);

    const activations = (Array.isArray(activationsData) ? activationsData : []) as ActivationLite[];
    for (const a of activations) {
      activationsById.set(a.id, a);
    }
  }

  // Compose rows
  const rows: AgentRow[] = agents.map((a) => {
    const link = linksByAgent.get(a.id);
    const zone = link?.zone_id ? zonesById.get(link.zone_id) : undefined;
    const district = zone?.district_id ? districtsById.get(zone.district_id) : undefined;

    // Prefer activation_id from link; fall back to zone.activation_id
    const activationId = (link?.activation_id as string | undefined) || (zone?.activation_id as string | undefined);
    const activation = activationId ? activationsById.get(activationId) : undefined;

    const parts: string[] = [];
    if (activation?.name) parts.push(activation.name);
    const districtZone =
      [district?.name, zone?.name].filter(Boolean).join(" / ") || "";
    if (districtZone) parts.push(districtZone);

    const desc = parts.length ? parts.join(" – ") : "—";

    return {
      id: a.id,
      name: a.name,
      slug: link?.slug || undefined,
      desc,
    };
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  const toShort = (slug: string) => `/l/${slug}`;
  const toAbsolute = (slug: string) => {
    const short = toShort(slug);
    return baseUrl ? `${baseUrl}${short}` : short;
  };

  return (
    <div className="space-y-6">
      <PageHeader icon="users" title="Agents" subtitle="Manage field agents and their unique links" />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Agent</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Link</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const short = r.slug ? toShort(r.slug) : "";
              const abs = r.slug ? toAbsolute(r.slug) : "";
              return (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3 text-gray-600">{r.desc}</td>
                  <td className="px-4 py-3">
                    {r.slug ? (
                      <a className="underline underline-offset-2" href={short} target="_blank">
                        {short}
                      </a>
                    ) : (
                      <span className="text-gray-400">No link</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {r.slug ? <CopyButton text={abs} /> : null}
                      {r.slug ? (
                        <a
                          className="btn-press rounded border px-3 py-1.5 text-xs hover:bg-gray-50"
                          href={short}
                          target="_blank"
                        >
                          Open
                        </a>
                      ) : null}
                      <a
                        className="btn-press rounded border px-3 py-1.5 text-xs hover:bg-gray-50"
                        href={`/app/agents/${r.id}`}
                      >
                        View stats
                      </a>
                      <a
                        className="btn-press rounded border px-3 py-1.5 text-xs hover:bg-gray-50"
                        href={`/app/agents/${r.id}/edit`}
                      >
                        Manage
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-gray-600" colSpan={4}>
                  No agents yet
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
  