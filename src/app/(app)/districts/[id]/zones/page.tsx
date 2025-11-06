
import PageHeader from "@/components/dashboard/PageHeader";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";

type DistrictLite = {
  id: string;
  name: string;
  activation_id: string | null;
  created_at: string | null;
};

type ActivationLite = {
  id: string;
  name: string;
};

type ZoneLite = {
  id: string;
  name: string;
  created_at: string | null;
};

export default async function DistrictZonesPage({ params }: { params: { id: string } }) {
  const supa = createServerComponentClient({ cookies });

  const {
    data: { user },
  } = await supa.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <PageHeader icon="map" title="District Zones" subtitle="View and manage zones within a district" />
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Please sign in to view this page.
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
        <PageHeader icon="map" title="District Zones" />
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          No organization found. Create your organization in Settings first.
        </div>
      </div>
    );
  }

  // Load the district (restricted by org)
  const { data: district } = await supa
    .from("districts")
    .select("id, name, activation_id, created_at, activation:activations(id, name)")
    .eq("id", params.id)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!district) {
    return (
      <div className="space-y-6">
        <PageHeader icon="map" title="District Zones" />
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          District not found.
        </div>
        <div>
          <Link href="/app/districts" className="btn-press rounded border px-3 py-1.5 text-sm hover:bg-gray-50">
            Back to Districts
          </Link>
        </div>
      </div>
    );
  }

  const d = district as unknown as DistrictLite & { activation?: ActivationLite[] | ActivationLite | null };

  const activationName =
    Array.isArray((d as any).activation)
      ? (d as any).activation?.[0]?.name
      : (d as any).activation?.name;

  // Load zones under this district
  const { data: zonesData } = await supa
    .from("zones")
    .select("id, name, created_at")
    .eq("district_id", d.id)
    .order("created_at", { ascending: true });

  const zones = (Array.isArray(zonesData) ? zonesData : []) as ZoneLite[];

  const createdTs = d.created_at
    ? new Date(d.created_at as unknown as string).toISOString().replace("T", " ").slice(0, 16)
    : "";

  return (
    <div className="space-y-6">
      <PageHeader
        icon="map"
        title={d.name || "District"}
        subtitle={`${activationName || "—"} – ${zones.length} zones • Created: ${createdTs}`}
      />

      {zones.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          No zones in this district yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {zones.map((z) => {
            const ts = z.created_at
              ? new Date(z.created_at as unknown as string).toISOString().replace("T", " ").slice(0, 16)
              : "";
            return (
              <div key={z.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold">{z.name}</div>
                  <div className="text-xs text-gray-500">{ts}</div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Link
                    href={`/app/zones/${z.id}`}
                    className="btn-press rounded border px-3 py-1.5 text-xs hover:bg-gray-50"
                  >
                    View
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div>
        <Link href="/app/districts" className="btn-press rounded border px-3 py-1.5 text-sm hover:bg-gray-50">
          Back to Districts
        </Link>
      </div>
    </div>
  );
}
  