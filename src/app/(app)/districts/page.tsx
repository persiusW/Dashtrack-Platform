
import PageHeader from "@/components/dashboard/PageHeader";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";

type DistrictRow = {
  id: string;
  name: string;
  created_at: string | null;
  activation?: { id: string; name: string }[] | null;
};

export default async function DistrictsPage() {
  const supa = createServerComponentClient({ cookies });
  const {
    data: { user },
  } = await supa.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <PageHeader icon="map" title="Districts" subtitle="Group zones under larger geographies" />
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Please sign in to view districts.
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
        <PageHeader icon="map" title="Districts" subtitle="Group zones under larger geographies" />
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          No organization found. Create your organization in Settings first.
        </div>
      </div>
    );
  }

  const { data: dList } = await supa
    .from("districts")
    .select("id, name, created_at, activation:activations(id, name)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  const districts = (Array.isArray(dList) ? dList : []) as DistrictRow[];

  // Build per-district zone counts with a single fetch
  const counts = new Map<string, number>();
  if (districts.length) {
    const ids = districts.map((d) => d.id);
    const { data: zRows } = await supa
      .from("zones")
      .select("district_id")
      .in("district_id", ids);

    const zoneRows = (Array.isArray(zRows) ? zRows : []) as Array<{ district_id: string | null }>;
    for (const z of zoneRows) {
      if (!z.district_id) continue;
      counts.set(z.district_id, (counts.get(z.district_id) || 0) + 1);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader icon="map" title="Districts" subtitle="Group zones under larger geographies" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {districts.map((d) => {
          const zoneCount = counts.get(d.id) ?? 0;
          const activationName =
            (Array.isArray(d.activation) ? d.activation?.[0]?.name : (d as any).activation?.name) || "—";
          const ts = d.created_at
            ? new Date(d.created_at as unknown as string)
                .toISOString()
                .replace("T", " ")
                .slice(0, 16)
            : "";
          return (
            <Link
              key={d.id}
              href={`/app/districts/${d.id}/zones`}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
            >
              <div className="text-lg font-semibold">{d.name}</div>
              <div className="mt-1 text-sm text-gray-600">Zones: {zoneCount}</div>
              <div className="mt-1 text-sm text-gray-600">Activation: {activationName}</div>
              <div className="mt-1 text-xs text-gray-500">Created: {ts}</div>
            </Link>
          );
        })}

        {districts.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-600">
            No districts yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}
