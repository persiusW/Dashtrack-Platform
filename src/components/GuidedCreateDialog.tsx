"use client";
import { useState } from "react";

export default function GuidedCreateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [zones, setZones] = useState<Array<{ name: string; agents: string[] }>>([{ name: "", agents: [""] }]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!open) return null;

  function addZone() {
    setZones((z) => [...z, { name: "", agents: [""] }]);
  }
  function removeZone(i: number) {
    setZones((z) => z.filter((_, idx) => idx !== i));
  }
  function setZoneName(i: number, v: string) {
    setZones((z) => z.map((row, idx) => (idx === i ? { ...row, name: v } : row)));
  }
  function addAgent(i: number) {
    setZones((z) => z.map((row, idx) => (idx === i ? { ...row, agents: [...row.agents, ""] } : row)));
  }
  function setAgentName(i: number, j: number, v: string) {
    setZones((z) =>
      z.map((row, idx) => {
        if (idx !== i) return row;
        const agents = row.agents.map((a, k) => (k === j ? v : a));
        return { ...row, agents };
      })
    );
  }
  function removeAgent(i: number, j: number) {
    setZones((z) =>
      z.map((row, idx) => {
        if (idx !== i) return row;
        const agents = row.agents.filter((_, k) => k !== j);
        return { ...row, agents: agents.length ? agents : [""] };
      })
    );
  }

  async function submit() {
    setBusy(true);
    setErr("");
    const payload = {
      name,
      redirect_url: redirectUrl,
      zones: zones.map((z) => ({
        name: z.name,
        agents: z.agents.map((a) => a.trim()).filter((a) => a.length > 0)
      }))
    };
    try {
      const r = await fetch("/api/activations/create-guided", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload)
      });
      const j = await r.json().catch(() => null);
      setBusy(false);
      if (!r.ok || !j?.ok) {
        setErr((j && j.error) || "Failed");
        return;
      }
      window.location.href = `/app/activations/${j.activation_id}`;
    } catch (e: any) {
      setBusy(false);
      setErr(e?.message || "Failed");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Create Activation (Guided)</h3>
          <button onClick={onClose} className="text-sm text-gray-600">Close</button>
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-600">Activation name</label>
            <input className="w-full border rounded px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Default redirect URL</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={redirectUrl}
              onChange={(e) => setRedirectUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-medium">Zones & Agents</div>
            <button onClick={addZone} className="text-sm border rounded px-3 py-1">Add Zone</button>
          </div>

          {zones.map((z, i) => (
            <div key={i} className="border rounded p-3 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 border rounded px-3 py-2"
                  placeholder={`Zone ${i + 1} name`}
                  value={z.name}
                  onChange={(e) => setZoneName(i, e.target.value)}
                />
                <button onClick={() => removeZone(i)} className="text-sm border rounded px-2 py-1">Remove</button>
              </div>
              <div className="space-y-2">
                {z.agents.map((a, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <input
                      className="flex-1 border rounded px-3 py-2"
                      placeholder={`Agent ${j + 1} name`}
                      value={a}
                      onChange={(e) => setAgentName(i, j, e.target.value)}
                    />
                    <button onClick={() => removeAgent(i, j)} className="text-sm border rounded px-2 py-1">-</button>
                    <button onClick={() => addAgent(i)} className="text-sm border rounded px-2 py-1">+</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
          <button
            onClick={submit}
            disabled={busy || !name.trim() || !redirectUrl.trim() || !zones.some((z) => z.name.trim())}
            className="px-4 py-2 rounded bg-black text-white"
          >
            {busy ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
