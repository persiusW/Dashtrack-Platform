"use client";
import { useEffect, useState } from "react";

export function useAgentModals() {
  const [editAgent, setEditAgent] = useState<{ id: string; name?: string; notes?: string } | null>(null);
  const [editLink, setEditLink] = useState<{ id: string; url: string } | null>(null);
  const [rezone, setRezone] = useState<{ id: string } | null>(null);

  useEffect(() => {
    function onClick(e: any) {
      const root = (e.target as HTMLElement)?.closest(
        "[data-edit-agent],[data-edit-link],[data-reassign-zone],[data-delete-agent]"
      ) as HTMLElement | null;
      if (!root || !root.dataset) return;

      if (root.dataset.editAgent) {
        setEditAgent({
          id: root.dataset.editAgent,
          name: root.dataset.agentName || "",
          notes: root.dataset.agentNotes || ""
        });
        return;
      }
      if (root.dataset.editLink) {
        setEditLink({ id: root.dataset.editLink, url: root.dataset.url || "" });
        return;
      }
      if (root.dataset.reassignZone) {
        setRezone({ id: root.dataset.reassignZone });
        return;
      }
      if (root.dataset.deleteAgent && confirm("Delete agent?")) {
        fetch(`/api/agents/${root.dataset.deleteAgent}`, { method: "DELETE" }).then(() => location.reload());
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return { editAgent, setEditAgent, editLink, setEditLink, rezone, setRezone };
}

export function EditAgentModal({ state, close }: { state: { id: string; name?: string; notes?: string } | null; close: () => void }) {
  const [name, setName] = useState(state?.name || "");
  const [notes, setNotes] = useState(state?.notes || "");
  useEffect(() => {
    setName(state?.name || "");
    setNotes(state?.notes || "");
  }, [state]);
  if (!state) return null;
  return (
    <Modal title="Edit agent" onClose={close}>
      <input
        className="w-full rounded border px-3 py-2 text-sm"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <textarea
        className="mt-2 w-full rounded border px-3 py-2 text-sm"
        placeholder="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="mt-3 flex gap-2">
        <button
          className="rounded bg-black px-3 py-2 text-sm text-white"
          onClick={() =>
            fetch(`/api/agents/${state.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, notes }),
            }).then(() => location.reload())
          }
          disabled={!name.trim()}
        >
          Save
        </button>
        <button className="rounded border px-3 py-2 text-sm" onClick={close}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}

export function EditLinkModal({
  state,
  close,
}: {
  state: { id: string; url: string } | null;
  close: () => void;
}) {
  const [url, setUrl] = useState(state?.url || "");
  useEffect(() => setUrl(state?.url || ""), [state]);
  if (!state) return null;
  return (
    <Modal title="Edit link redirect" onClose={close}>
      <input
        className="w-full rounded border px-3 py-2 text-sm"
        placeholder="https://…"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <div className="mt-3 flex gap-2">
        <button
          className="rounded bg-black px-3 py-2 text-sm text-white"
          onClick={() =>
            fetch(`/api/links/${state.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ redirect_url: url }),
            }).then(() => location.reload())
          }
        >
          Save
        </button>
        <button className="rounded border px-3 py-2 text-sm" onClick={close}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}

export function ReassignZoneModal({ state, close }: { state: { id: string } | null; close: () => void }) {
  const [zoneId, setZoneId] = useState("");
  const [zones, setZones] = useState<Array<{ id: string; label: string }>>([]);

  useEffect(() => {
    async function loadZones() {
      try {
        const res = await fetch("/api/zones", { method: "GET" });
        if (!res.ok) return;
        const json = (await res.json()) as { ok: boolean; zones?: Array<{ id: string; label: string }> };
        if (json.ok && Array.isArray(json.zones)) {
          setZones(json.zones);
          if (!zoneId && json.zones.length) setZoneId(json.zones[0].id);
        }
      } catch {}
    }
    if (state) {
      loadZones();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (!state) return null;
  return (
    <Modal title="Reassign zone" onClose={close}>
      <select
        className="w-full rounded border px-3 py-2 text-sm"
        value={zoneId}
        onChange={(e) => setZoneId(e.target.value)}
      >
        {zones.map((z) => (
          <option key={z.id} value={z.id}>
            {z.label}
          </option>
        ))}
      </select>
      <div className="mt-3 flex gap-2">
        <button
          className="rounded bg-black px-3 py-2 text-sm text-white"
          onClick={() =>
            fetch(`/api/agents/${state.id}/zone`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ zone_id: zoneId }),
            }).then(() => location.reload())
          }
          disabled={!zoneId}
        >
          Save
        </button>
        <button className="rounded border px-3 py-2 text-sm" onClick={close}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-lg font-semibold">{title}</div>
          <button onClick={onClose} className="rounded px-2 py-1 text-sm hover:bg-gray-100" aria-label="Close dialog">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
