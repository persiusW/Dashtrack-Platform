"use client";
import React, { useState } from "react";

export default function EnsureDefaultLinkButton({ zoneId }: { zoneId: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function ensureDefault() {
    setBusy(true);
    setErr("");
    try {
      const r = await fetch(`/api/zones/${zoneId}/detail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const j = await r.json();
      if (!j.ok) {
        setErr(j.error || "Failed to ensure default link");
        setBusy(false);
        return;
      }
      window.location.reload();
    } catch (e: unknown) {
      setErr("Network error");
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={ensureDefault}
        disabled={busy}
        className="bg-black text-white px-3 py-1.5 rounded"
      >
        {busy ? "Ensuring…" : "Ensure default link"}
      </button>
      {err && <span className="text-sm text-red-600">{err}</span>}
    </div>
  );
}
