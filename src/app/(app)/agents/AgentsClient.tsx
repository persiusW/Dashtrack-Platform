
    "use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CopyButton from "@/components/ui/CopyButton";

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

export default function AgentsClient({ rows }: { rows: AgentListRow[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [activation, setActivation] = useState("");

  const [debouncedQ, setDebouncedQ] = useState(q);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const activations = useMemo(
    () => Array.from(new Set(rows.map(r => r.activationName).filter(Boolean))),
    [rows]
  );

  const filtered = useMemo(() => {
    const t = debouncedQ.trim().toLowerCase();
    return rows.filter(r => {
      const matchesQ = !t || r.name.toLowerCase().includes(t) || (r.slug || "").toLowerCase().includes(t);
      const matchesAct = !activation || r.activationName === activation;
      return matchesQ && matchesAct;
    });
  }, [rows, debouncedQ, activation]);

  const [editing, setEditing] = useState<AgentListRow | null>(null);
  const [reassigning, setReassigning] = useState<AgentListRow | null>(null);
  const [editingLink, setEditingLink] = useState<AgentListRow | null>(null);

  async function patchAgent(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/agents/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error("Failed to update agent");
  }
  async function patchLink(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/links/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error("Failed to update link");
  }
  async function deleteAgent(id: string) {
    if (!confirm("Delete agent?")) return;
    const res = await fetch(`/api/agents/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete agent");
  }

  function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
          <div className="mb-2 text-base font-semibold">{title}</div>
          <div className="space-y-3">{children}</div>
          <div className="mt-4 flex justify-end">
            <button className="btn-press rounded border px-3 py-1.5 text-xs hover:bg-gray-50" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <input
            placeholder="Search by name or slug…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-64 rounded-lg border px-3 py-2 text-sm"
          />
          <select
            value={activation}
            onChange={(e) => setActivation(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">All Activations</option>
            {activations.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Agent</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Link</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const desc = `${r.activationName || "—"} – ${r.districtName || "—"} / ${r.zoneName || "—"}`;
              return (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3 text-gray-600">{desc}</td>
                  <td className="px-4 py-3">
                    {r.slug ? <a className="underline underline-offset-2" href={r.shortUrl} target="_blank">{r.shortUrl}</a> : <span className="text-gray-400">No link</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {r.absoluteUrl && <CopyButton text={r.absoluteUrl} />}
                      {r.slug && <a className="btn-press rounded border px-3 py-1.5 text-xs hover:bg-gray-50" href={r.shortUrl} target="_blank">Open</a>}
                      <Link className="btn-press rounded border px-3 py-1.5 text-xs hover:bg-gray-50" href={`/agents/${r.id}`}>View stats</Link>
                      <Link className="btn-press rounded border px-3 py-1.5 text-xs hover:bg-gray-50" href={`/agents/${r.id}/edit`}>Manage</Link>
                      <button className="btn-press rounded border px-3 py-1.5 text-xs hover:bg-gray-50" onClick={() => setEditing(r)}>Edit</button>
                      <button className="btn-press rounded border px-3 py-1.5 text-xs hover:bg-gray-50" onClick={() => setReassigning(r)}>Reassign zone</button>
                      {r.linkId && <button className="btn-press rounded border px-3 py-1.5 text-xs hover:bg-gray-50" onClick={() => setEditingLink(r)}>Edit link</button>}
                      <button className="btn-press rounded border px-3 py-1.5 text-xs hover:bg-gray-50" onClick={async () => { await deleteAgent(r.id); router.refresh(); }}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td className="px-4 py-10 text-center text-gray-600" colSpan={4}>No agents found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Agent */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit agent">
        {editing && (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget as HTMLFormElement);
              const name = String(f.get("name") || "").trim();
              const notes = String(f.get("notes") || "").trim();
              await patchAgent(editing.id, { name, notes });
              setEditing(null);
              router.refresh();
            }}
          >
            <label className="block">
              <span className="text-xs text-gray-600">Name</span>
              <input name="name" defaultValue={editing.name} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-xs text-gray-600">Notes</span>
              <textarea name="notes" defaultValue={editing.notes} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
            </label>
            <div className="flex justify-end">
              <button className="btn-press rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-900" type="submit">Save</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Reassign Zone (simple ID for v1) */}
      <Modal open={!!reassigning} onClose={() => setReassigning(null)} title="Reassign zone">
        {reassigning && (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget as HTMLFormElement);
              const zone_id = String(f.get("zone_id") || "");
              await patchAgent(reassigning.id, { zone_id });
              setReassigning(null);
              router.refresh();
            }}
          >
            <label className="block">
              <span className="text-xs text-gray-600">Zone ID</span>
              <input name="zone_id" placeholder="Enter zone id…" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
            </label>
            <div className="flex justify-end">
              <button className="btn-press rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-900" type="submit">Save</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Edit Link redirect */}
      <Modal open={!!editingLink} onClose={() => setEditingLink(null)} title="Edit link">
        {editingLink && (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget as HTMLFormElement);
              const redirect_url = String(f.get("redirect_url") || "").trim();
              if (editingLink.linkId) {
                await patchLink(editingLink.linkId, { redirect_url });
              }
              setEditingLink(null);
              router.refresh();
            }}
          >
            <div className="text-xs text-gray-600">Slug: <span className="font-mono">{editingLink.slug}</span></div>
            <label className="block">
              <span className="text-xs text-gray-600">Redirect URL</span>
              <input name="redirect_url" defaultValue={editingLink.redirectUrl || ""} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
            </label>
            <div className="flex justify-end">
              <button className="btn-press rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-900" type="submit">Save</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
