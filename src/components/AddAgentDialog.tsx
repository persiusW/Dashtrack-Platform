
"use client";
import React, { useState } from "react";

export default function AddAgentDialog({ zoneId }: { zoneId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setBusy(true);
    setErr("");
    try {
      const r = await fetch(`/api/zones/${zoneId}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      const j = await r.json();
      setBusy(false);
      if (!j.ok) {
        setErr(j.error || "Failed to add agent");
        return;
      }
      window.location.reload();
    } catch (_) {
      setBusy(false);
      setErr("Network error");
    }
  }

  return (
    <>
      <button className="bg-black text-white px-4 py-2 rounded" onClick={() => setOpen(true)}>
        Add Agent
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Add Agent</h3>
              <button onClick={() => setOpen(false)} className="text-sm text-gray-600">
                Close
              </button>
            </div>
            {err && <div className="mt-3 text-sm text-red-600">{err}</div>}
            <div className="mt-4 space-y-3">
              <label className="text-sm text-gray-600">Agent name</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="mt-5 flex gap-2 justify-end">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded border">
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={busy || !name.trim()}
                className="px-4 py-2 rounded bg-black text-white"
              >
                {busy ? "Adding…" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
  