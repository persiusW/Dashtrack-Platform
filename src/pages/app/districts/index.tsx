import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useState } from "react";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { AppLayout } from "@/components/layouts/AppLayout";

type Activation = { id: string; name: string };
type District = { id: string; name: string; created_at: string | null };
type Zone = { id: string; district_id: string | null };

type Props = {
  orgId: string | null;
  activation: Activation | null;
  districts: District[];
  zoneCounts: Array<{ districtId: string; count: number }>;
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const supabase = createPagesServerClient(ctx);

  const { data: sessionRes } = await supabase.auth.getSession();
  if (!sessionRes?.session) {
    return { redirect: { destination: "/login?next=/app/districts", permanent: false } };
  }

  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes?.user?.id || null;

  let orgId: string | null = null;

  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .maybeSingle();
    orgId = (profile as any)?.organization_id ?? null;
  }

  if (!orgId) {
    return {
      props: {
        orgId: null,
        activation: null,
        districts: [],
        zoneCounts: [],
      },
    };
  }

  // Latest activation for this org
  const { data: act } = await supabase
    .from("activations")
    .select("id, name, created_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!act?.id) {
    return {
      props: {
        orgId,
        activation: null,
        districts: [],
        zoneCounts: [],
      },
    };
  }

  // Districts for this activation
  const { data: dList } = await supabase
    .from("districts")
    .select("id, name, created_at")
    .eq("activation_id", act.id)
    .order("created_at", { ascending: true });

  // Zones for this activation (for counts)
  const { data: zList } = await supabase
    .from("zones")
    .select("id, district_id")
    .eq("activation_id", act.id);

  const countsMap = new Map<string, number>();
  (zList as Zone[] | null)?.forEach((z) => {
    if (z.district_id) {
      countsMap.set(z.district_id, (countsMap.get(z.district_id) || 0) + 1);
    }
  });

  const zoneCounts = Array.from(countsMap.entries()).map(([districtId, count]) => ({ districtId, count }));

  return {
    props: {
      orgId,
      activation: { id: act.id, name: act.name },
      districts: (dList as District[] | null) ?? [],
      zoneCounts,
    },
  };
};

export default function DistrictsPage({ orgId, activation, districts, zoneCounts }: Props) {
  if (!orgId) {
    return (
      <AppLayout>
        <CenterCard
          title="No organization"
          subtitle="Create your organization in Settings first."
          cta={{ href: "/app/settings", label: "Go to Settings" }}
        />
      </AppLayout>
    );
  }

  if (!activation) {
    return (
      <AppLayout>
        <CenterCard
          title="No activations yet"
          subtitle="Create your first activation to add districts and zones."
          cta={{ href: "/app/activations", label: "Create Activation" }}
        />
      </AppLayout>
    );
  }

  const getCount = (id: string) => zoneCounts.find((c) => c.districtId === id)?.count ?? 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Districts</h1>
          <CreateDistrictButton activationId={activation.id} />
        </div>

        {!districts?.length ? (
          <CenterCard
            title="No districts yet"
            subtitle="Start with 'Ungrouped' or create your first district."
          >
            <div className="mt-4">
              <CreateDistrictButton activationId={activation.id} />
            </div>
          </CenterCard>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {districts.map((d) => {
              const ts = d.created_at
                ? new Date(d.created_at).toISOString().replace("T", " ").slice(0, 16)
                : "";
              return (
                <Link
                  key={d.id}
                  href={`/app/districts/${d.id}/zones`}
                  className="block rounded-xl border p-4 bg-white hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{d.name}</div>
                    <div className="text-xs text-gray-600">{getCount(d.id)} zones</div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{ts}</div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function CenterCard({
  title,
  subtitle,
  cta,
  children,
}: {
  title: string;
  subtitle: string;
  cta?: { href: string; label: string };
  children?: React.ReactNode;
}) {
  return (
    <div className="max-w-xl mx-auto text-center mt-16">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="mt-2 text-gray-600">{subtitle}</p>
      {children}
      {cta && (
        <Link
          href={cta.href}
          className="inline-block mt-6 bg-black text-white px-4 py-2 rounded"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}

function CreateDistrictButton({ activationId }: { activationId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="bg-black text-white px-4 py-2 rounded"
        onClick={() => setOpen(true)}
      >
        New District
      </button>
      {open ? (
        <CreateDistrictDialog
          activationId={activationId}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function CreateDistrictDialog({
  activationId,
  onClose,
}: {
  activationId: string;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/districts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name, activation_id: activationId }),
      });
      const j = await r.json().catch(() => null);
      setBusy(false);
      if (!r.ok || !j?.ok) {
        setErr((j && j.error) || "Failed");
        return;
      }
      window.location.reload();
    } catch (e: any) {
      setBusy(false);
      setErr(e?.message || "Failed");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Create District</h3>
          <button onClick={onClose} className="text-sm text-gray-600">
            Close
          </button>
        </div>
        {err && <div className="mt-3 text-sm text-red-600">{err}</div>}
        <div className="mt-4 space-y-3">
          <label className="text-sm text-gray-600">District name</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., New York"
          />
        </div>
        <div className="mt-5 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded border">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name.trim() || busy}
            className="px-4 py-2 rounded bg-black text-white"
          >
            {busy ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
