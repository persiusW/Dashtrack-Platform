import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useState } from "react";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { AppLayout } from "@/components/layouts/AppLayout";
import { RowActions } from "@/components/RowActions";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { RenameDialog } from "@/components/RenameDialog";

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

  const { data: dList } = await supabase
    .from("districts")
    .select("id, name, created_at")
    .eq("activation_id", act.id)
    .order("created_at", { ascending: true });

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
  const [items, setItems] = useState<District[]>(districts ?? []);
  const [counts, setCounts] = useState<Map<string, number>>(
    () => new Map(zoneCounts.map((z) => [z.districtId, z.count]))
  );

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

  const hasItems = items && items.length > 0;

  const handleRenamed = (id: string, newName: string) => {
    setItems((prev) => prev.map((d) => (d.id === id ? { ...d, name: newName } : d)));
  };

  const handleDeleted = (id: string) => {
    setItems((prev) => prev.filter((d) => d.id !== id));
    setCounts((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Districts</h1>
          <CreateDistrictButton activationId={activation.id} />
        </div>

        {!hasItems ? (
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
            {items.map((d) => {
              const ts = d.created_at
                ? new Date(d.created_at as unknown as string).toISOString().replace("T", " ").slice(0, 16)
                : "";
              const zoneCount = counts.get(d.id) ?? 0;
              return (
                <DistrictCard
                  key={d.id}
                  d={d}
                  ts={ts}
                  zoneCount={zoneCount}
                  onRenamed={handleRenamed}
                  onDeleted={handleDeleted}
                />
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function DistrictCard({
  d,
  ts,
  zoneCount,
  onRenamed,
  onDeleted,
}: {
  d: District;
  ts: string;
  zoneCount: number;
  onRenamed: (id: string, newName: string) => void;
  onDeleted: (id: string) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function doDelete() {
    try {
      setBusy(true);
      const r = await fetch(`/api/districts/${d.id}`, { method: "DELETE" });
      const j = await r.json().catch(() => ({}));
      setConfirmOpen(false);
      if (!r.ok || !j?.ok) {
        alert((j && j.error) || "Delete failed");
        return;
      }
      onDeleted(d.id);
    } finally {
      setBusy(false);
    }
  }

  async function doRename(name: string) {
    try {
      setBusy(true);
      const r = await fetch(`/api/districts/${d.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) {
        alert((j && j.error) || "Update failed");
        return;
      }
      setRenameOpen(false);
      onRenamed(d.id, name);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="block rounded-xl border p-4 bg-white hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <Link href={`/app/districts/${d.id}/zones`} className="font-medium truncate">
          {d.name}
        </Link>
        <RowActions
          onRename={() => setRenameOpen(true)}
          onDelete={() => setConfirmOpen(true)}
          size="sm"
          disabled={busy}
        />
      </div>
      <div className="flex items-center justify-between mt-1">
        <div className="text-xs text-gray-600">{zoneCount} zones</div>
        <div className="text-xs text-gray-500">{ts}</div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={doDelete}
        title="Delete district?"
        message={`This will permanently delete "${d.name}".`}
        confirmLabel="Delete"
      />
      <RenameDialog
        open={renameOpen}
        onCancel={() => setRenameOpen(false)}
        onSave={doRename}
        initial={d.name}
        title="Rename district"
        label="District name"
      />
    </div>
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
        setErr((j && (j as any).error) || "Failed");
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
