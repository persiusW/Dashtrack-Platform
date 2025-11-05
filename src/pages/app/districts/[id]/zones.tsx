import type { GetServerSideProps } from "next";
import Link from "next/link";
import { useState } from "react";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { AppLayout } from "@/components/layouts/AppLayout";
import { RowActions } from "@/components/RowActions";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { RenameDialog } from "@/components/RenameDialog";

type District = { id: string; name: string; activation_id: string };
type Zone = { id: string; name: string; created_at: string | null };

type Props = {
  district: District | null;
  zones: Zone[];
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const supabase = createPagesServerClient(ctx);

  const { data: sessionRes } = await supabase.auth.getSession();
  if (!sessionRes?.session) {
    const { id } = ctx.params as { id: string };
    return { redirect: { destination: `/login?next=/app/districts/${id}/zones`, permanent: false } };
  }

  const { id } = ctx.params as { id: string };

  const { data: district } = await supabase
    .from("districts")
    .select("id, name, activation_id")
    .eq("id", id)
    .maybeSingle();

  if (!district?.id) {
    return {
      props: {
        district: null,
        zones: [],
      },
    };
  }

  const { data: zones } = await supabase
    .from("zones")
    .select("id, name, created_at")
    .eq("district_id", district.id)
    .order("created_at", { ascending: true });

  return {
    props: {
      district: district as District,
      zones: (zones as Zone[]) ?? [],
    },
  };
};

export default function DistrictZonesPage({ district, zones }: Props) {
  const [items, setItems] = useState<Zone[]>(zones ?? []);

  if (!district) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto text-center mt-16">
          <h2 className="text-2xl font-semibold">District not found</h2>
          <Link className="inline-block mt-6 bg-black text-white px-4 py-2 rounded" href="/app/districts">
            Back to Districts
          </Link>
        </div>
      </AppLayout>
    );
  }

  const handleRenamed = (id: string, newName: string) => {
    setItems((prev) => prev.map((z) => (z.id === id ? { ...z, name: newName } : z)));
  };

  const handleDeleted = (id: string) => {
    setItems((prev) => prev.filter((z) => z.id !== id));
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">
              <Link href="/app/districts" className="hover:underline">
                Districts
              </Link>{" "}
              / {district.name}
            </div>
            <h1 className="text-2xl font-bold">Zones</h1>
          </div>
          <CreateZoneButton districtId={district.id} />
        </div>

        {!items?.length ? (
          <div className="max-w-xl text-center mx-auto mt-16">
            <p className="text-gray-600">No zones in this district yet.</p>
            <div className="mt-4">
              <CreateZoneButton districtId={district.id} />
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {items.map((z) => {
              const ts = z.created_at
                ? new Date(z.created_at as unknown as string).toISOString().replace("T", " ").slice(0, 16)
                : "";
              return (
                <ZoneCard
                  key={z.id}
                  z={z}
                  ts={ts}
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

function ZoneCard({
  z,
  ts,
  onRenamed,
  onDeleted,
}: {
  z: Zone;
  ts: string;
  onRenamed: (id: string, newName: string) => void;
  onDeleted: (id: string) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function doDelete() {
    try {
      setBusy(true);
      const r = await fetch(`/api/zones/${z.id}`, { method: "DELETE" });
      const j = await r.json().catch(() => ({}));
      setConfirmOpen(false);
      if (!r.ok || !j?.ok) {
        alert((j && j.error) || "Delete failed");
        return;
      }
      onDeleted(z.id);
    } finally {
      setBusy(false);
    }
  }

  async function doRename(name: string) {
    try {
      setBusy(true);
      const r = await fetch(`/api/zones/${z.id}`, {
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
      onRenamed(z.id, name);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border p-4 bg-white hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="font-medium truncate">{z.name}</div>
        <RowActions
          onRename={() => setRenameOpen(true)}
          onDelete={() => setConfirmOpen(true)}
          size="sm"
          disabled={busy}
        />
      </div>
      <div className="text-xs text-gray-600 mt-1">{ts}</div>

      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={doDelete}
        title="Delete zone?"
        message={`This will permanently delete "${z.name}".`}
        confirmLabel="Delete"
      />
      <RenameDialog
        open={renameOpen}
        onCancel={() => setRenameOpen(false)}
        onSave={doRename}
        initial={z.name}
        title="Rename zone"
        label="Zone name"
      />
    </div>
  );
}

function CreateZoneButton({ districtId }: { districtId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="bg-black text-white px-4 py-2 rounded" onClick={() => setOpen(true)}>
        New Zone
      </button>
      {open ? <CreateZoneDialog districtId={districtId} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function CreateZoneDialog({ districtId, onClose }: { districtId: string; onClose: () => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/zones/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ district_id: districtId, name }),
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
          <h3 className="text-lg font-semibold">Create Zone</h3>
          <button onClick={onClose} className="text-sm text-gray-600">
            Close
          </button>
        </div>
        {err && <div className="mt-3 text-sm text-red-600">{err}</div>}
        <div className="mt-4 space-y-3">
          <label className="text-sm text-gray-600">Zone name</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Times Square Stand"
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
