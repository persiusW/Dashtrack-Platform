"use client";
import { useState } from "react";

export default function QuickCreateDialog({ open, onClose }: { open:boolean; onClose: ()=>void }) {
  const [name, setName] = useState("");
  const [zones, setZones] = useState(1);
  const [agents, setAgents] = useState(1);
  const [redirectUrl, setRedirectUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!open) return null;

  async function submit() {
    setBusy(true); setErr("");
    const r = await fetch("/api/activations/quick-create", {
      method:"POST",
      headers: { "Content-Type":"application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        name,
        zones,
        agentsPerZone: agents,
        redirect_url: redirectUrl
      })
    });
    const j = await r.json().catch(() => null);
    setBusy(false);
    if (!r.ok || !j?.ok) { setErr((j && j.error) || "Failed to create"); return; }
    window.location.href = `/app/activations/${j.activation_id}`;
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-white rounded-2xl border p-5 space-y-4">
        <div className="text-lg font-semibold">Create Activation</div>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <input className="w-full border rounded px-3 py-2" placeholder="Activation name" value={name} onChange={e=>setName(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" placeholder="Default redirect URL (store page)" value={redirectUrl} onChange={e=>setRedirectUrl(e.target.value)} />
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-sm text-gray-600">Zones (max 5)</label>
            <input type="number" min={1} max={5} className="w-full border rounded px-3 py-2" value={zones} onChange={e=>setZones(Number(e.target.value))} />
          </div>
          <div className="flex-1">
            <label className="text-sm text-gray-600">Agents per zone</label>
            <input type="number" min={1} max={50} className="w-full border rounded px-3 py-2" value={agents} onChange={e=>setAgents(Number(e.target.value))} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
          <button
            onClick={submit}
            disabled={busy || !name.trim() || !redirectUrl.trim()}
            className="px-4 py-2 rounded bg-black text-white"
          >
            {busy ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
