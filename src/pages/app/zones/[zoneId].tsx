import React, { useEffect, useState } from "react";
import type { NextPage } from "next";
import Link from "next/link";
import AddAgentDialog from "@/components/AddAgentDialog";
import EnsureDefaultLinkButton from "@/components/EnsureDefaultLinkButton";
import { useRouter } from "next/router";

type AgentLink = {
  id: string;
  slug: string;
  description: string | null;
  redirect_url: string | null;
  created_at?: string;
};

type AgentItem = {
  id: string;
  name: string;
  created_at: string;
  links: AgentLink[];
};

type ZoneDetail = {
  ok: boolean;
  zone: { id: string; name: string; activation_id: string; district_id: string | null; organization_id: string };
  defaultLink: AgentLink | null;
  agents: AgentItem[];
};

const ZonePage: NextPage<{ zoneId: string }> = () => {
  const [data, setData] = useState<ZoneDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [zoneId, setZoneId] = useState<string>("");

  useEffect(() => {
    const id = router.query.zoneId;
    if (typeof id === "string") {
      setZoneId(id);
    }
  }, [router.query.zoneId]);

  useEffect(() => {
    if (!zoneId) return;
    async function load() {
      try {
        setLoading(true);
        const r = await fetch(`/api/zones/${zoneId}/detail`, { cache: "no-store" });
        const j = await r.json();
        setData(j);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [zoneId]);

  if (loading) {
    return <div className="p-4">Loading…</div>;
  }

  if (!data?.ok || !data.zone) {
    return (
      <div className="max-w-xl mx-auto text-center mt-16">
        <h2 className="text-2xl font-semibold">Zone not found</h2>
        <Link href="/app/districts" className="inline-block mt-6 bg-black text-white px-4 py-2 rounded">
          Back to Districts
        </Link>
      </div>
    );
  }

  const { zone, defaultLink, agents } = data;
  const zonesHref = zone.district_id ? `/app/districts/${zone.district_id}/zones` : "/app/districts";

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">
            <Link href="/app/districts" className="hover:underline">Districts</Link>
            {" / "}
            <Link href={zonesHref} className="hover:underline">
              Zones
            </Link>
            {" / "}
            {zone.name}
          </div>
          <h1 className="text-2xl font-bold">Zone details</h1>
        </div>
        <AddAgentDialog zoneId={zone.id} />
      </div>

      <div className="rounded-xl border p-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="font-medium">Default zone link</div>
          <EnsureDefaultLinkButton zoneId={zone.id} />
        </div>
        {defaultLink ? (
          <div className="mt-2 text-sm">
            <div className="truncate">/{defaultLink.slug}</div>
            <div className="text-gray-600 truncate">→ {defaultLink.redirect_url}</div>
            {defaultLink.description && (
              <div className="text-xs text-gray-500 mt-1">{defaultLink.description}</div>
            )}
          </div>
        ) : (
          <div className="mt-2 text-sm text-gray-600">No default link yet. Click "Ensure default link".</div>
        )}
      </div>

      <div className="space-y-3">
        <div className="text-lg font-semibold">Agents</div>
        {!agents?.length ? (
          <div className="rounded-xl border p-4 bg-white text-gray-600">No agents yet. Use “Add Agent”.</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {agents.map((a) => (
              <div key={a.id} className="rounded-xl border p-4 bg-white">
                <div className="font-medium">{a.name}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {new Date(a.created_at).toLocaleString(undefined, { timeZone: "UTC" })}
                </div>
                <div className="mt-3 space-y-1">
                  {a.links?.length ? (
                    a.links.map((l) => (
                      <div key={l.id} className="text-sm">
                        <div className="truncate">/{l.slug}</div>
                        <div className="text-gray-600 truncate">→ {l.redirect_url}</div>
                        {l.description && <div className="text-xs text-gray-500">{l.description}</div>}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No link yet</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ZonePage;