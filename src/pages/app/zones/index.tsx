import { useState, useMemo } from "react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { AppLayout } from "@/components/layouts/AppLayout";
import QuickCreateDialog from "@/components/QuickCreateDialog";

type Zone = {
  id: string;
  name: string;
  activation_id: string;
  created_at: string | null;
  district_id?: string | null;
};

type District = {
  id: string;
  name: string;
};

type ZonesProps = {
  organizationId: string | null;
  activation:
    | {
        id: string;
        name: string;
      }
    | null;
  districts: District[];
  zones: Zone[];
};

export const getServerSideProps: GetServerSideProps<ZonesProps> = async (ctx) => {
  const supabase = createPagesServerClient(ctx);

  const { data: sessionRes } = await supabase.auth.getSession();
  if (!sessionRes?.session) {
    return { redirect: { destination: "/login?next=/app/zones", permanent: false } };
  }

  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes?.user?.id || null;

  let organizationId: string | null = null;

  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .maybeSingle();
    organizationId = profile?.organization_id ?? null;
  }

  if (!organizationId && userId) {
    const { data: ownedOrg } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    organizationId = ownedOrg?.id ?? null;
  }

  if (!organizationId) {
    return {
      props: {
        organizationId: null,
        activation: null,
        districts: [],
        zones: [],
      },
    };
  }

  // Pick the most recent activation for this org
  const { data: act } = await supabase
    .from("activations")
    .select("id, name")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!act?.id) {
    return {
      props: {
        organizationId,
        activation: null,
        districts: [],
        zones: [],
      },
    };
  }

  // Load districts and zones for that activation
  const [{ data: districts }, { data: zones }] = await Promise.all([
    supabase.from("districts").select("id, name").eq("activation_id", act.id).order("created_at"),
    supabase
      .from("zones")
      .select("id, name, activation_id, created_at, district_id")
      .eq("activation_id", act.id)
      .order("created_at", { ascending: false }),
  ]);

  return {
    props: {
      organizationId,
      activation: { id: act.id, name: act.name },
      districts: (districts as District[]) ?? [],
      zones:
        (zones as (Zone & { district_id?: string | null })[])?.map((z) => ({
          id: z.id,
          name: z.name,
          activation_id: z.activation_id,
          created_at: z.created_at ?? null,
          district_id: (z as any).district_id ?? null,
        })) ?? [],
    },
  };
};

export default function ZonesPage({ organizationId, activation, districts, zones }: ZonesProps) {
  if (!organizationId) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto text-center mt-16">
          <h2 className="text-2xl font-semibold">No organization</h2>
          <p className="mt-2 text-gray-600">Create your organization in Settings first.</p>
          <Link href="/app/settings" className="inline-block mt-6 bg-black text-white px-4 py-2 rounded">
            Go to Settings
          </Link>
        </div>
      </AppLayout>
    );
  }

  if (!activation) {
    return (
      <AppLayout>
        <NoActivationsMessage />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ZonesClient activation={activation} districts={districts} zones={zones} />
    </AppLayout>
  );
}

function ZonesClient({
  activation,
  districts,
  zones,
}: {
  activation: { id: string; name: string };
  districts: District[];
  zones: Zone[];
}) {
  const [districtFilter, setDistrictFilter] = useState<string>("all");
  const [localZones, setLocalZones] = useState<Zone[]>(zones);

  const districtMap = useMemo(() => {
    const map: Record<string, string> = {};
    districts.forEach((d) => {
      map[d.id] = d.name;
    });
    return map;
  }, [districts]);

  const filteredZones = useMemo(() => {
    if (districtFilter === "all") return localZones;
    return localZones.filter((z) => (z.district_id ?? null) === districtFilter);
  }, [localZones, districtFilter]);

  if (!zones || zones.length === 0) {
    return (
      <div className="max-w-xl mx-auto text-center mt-16">
        <h2 className="text-2xl font-semibold">No zones yet</h2>
        <p className="mt-2 text-gray-600">
          Zones are created when you set up activations. You can manage or add more zones later.
        </p>
        <NoActivationsMessageInner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Zones</h1>
      </div>

      <div className="flex gap-3 items-center">
        <label className="text-sm text-gray-600">District</label>
        <select
          className="border rounded px-3 py-2"
          value={districtFilter}
          onChange={(e) => setDistrictFilter(e.target.value)}
        >
          <option value="all">All</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <div className="ml-auto text-sm text-gray-500">
          Activation: <span className="font-medium">{activation.name}</span>
        </div>
      </div>

      <div className="grid gap-3">
        {filteredZones.map((z) => {
          const ts = z.created_at ? new Date(z.created_at).toISOString().replace("T", " ").slice(0, 16) : "";
          return (
            <div key={z.id} className="rounded-xl border p-4 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="font-medium">{z.name}</div>
                  <ZoneDistrictSelect
                    zoneId={z.id}
                    districts={districts}
                    current={z.district_id ?? null}
                    onChanged={(newId: string | null) => {
                      setLocalZones((prev) =>
                        prev.map((item) =>
                          item.id === z.id ? { ...item, district_id: newId } as Zone : item
                        )
                      );
                    }}
                  />
                </div>
                <div className="text-xs text-gray-600">{ts}</div>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                <Link className="underline" href={`/app/zones/${z.id}`}>View</Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ZoneDistrictSelect({
  zoneId,
  districts,
  current,
  onChanged,
}: {
  zoneId: string;
  districts: Array<{ id: string; name: string }>;
  current: string | null;
  onChanged: (newDistrictId: string | null) => void;
}) {
  const [value, setValue] = useState<string>(current || "none");
  async function update(v: string) {
    const prev = value;
    setValue(v);
    const payload = { district_id: v === "none" ? null : v };
    try {
      const r = await fetch(`/api/zones/${zoneId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) {
        setValue(prev);
        alert((j && j.error) || "Update failed");
        return;
      }
      onChanged(payload.district_id);
    } catch (e) {
      setValue(prev);
      alert("Update failed");
    }
  }
  return (
    <select
      className="border rounded px-2 py-1 text-xs"
      value={value}
      onChange={(e) => update(e.target.value)}
    >
      <option value="none">Ungrouped</option>
      {districts.map((d: any) => (
        <option key={d.id} value={d.id}>
          {d.name}
        </option>
      ))}
    </select>
  );
}

function NoActivationsMessageInner() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-6">
      <button className="bg-black text-white px-4 py-2 rounded" onClick={() => setOpen(true)}>
        Create Activation
      </button>
      <QuickCreateDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function NoActivationsMessage() {
  return (
    <div className="max-w-xl mx-auto text-center mt-16">
      <h2 className="text-2xl font-semibold">No activations yet</h2>
      <p className="mt-2 text-gray-600">Create an activation to manage zones.</p>
      <NoActivationsMessageInner />
    </div>
  );
}
