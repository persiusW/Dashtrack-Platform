"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import CopyButton from "@/components/ui/CopyButton";
import { useAgentModals, EditAgentModal, EditLinkModal, ReassignZoneModal } from "./AgentModals";

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
  const [q, setQ] = useState("");
  const [activation, setActivation] = useState("");

  const [debouncedQ, setDebouncedQ] = useState(q);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const activations = useMemo(
    () => Array.from(new Set(rows.map((r) => r.activationName).filter(Boolean))),
    [rows]
  );

  const filtered = useMemo(() => {
    const t = debouncedQ.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesQ =
        !t || r.name.toLowerCase().includes(t) || (r.slug || "").toLowerCase().includes(t);
      const matchesAct = !activation || r.activationName === activation;
      return matchesQ && matchesAct;
    });
  }, [rows, debouncedQ, activation]);

  const { editAgent, setEditAgent, editLink, setEditLink, rezone, setRezone } = useAgentModals();

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
            {activations.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
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
                    {r.slug ? (
                      <a className="underline underline-offset-2" href={r.shortUrl} target="_blank">
                        {r.shortUrl}
                      </a>
                    ) : (
                      <span className="text-gray-400">No link</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {r.absoluteUrl && <CopyButton text={r.absoluteUrl} />}
                      {r.slug && (
                        <a
                          className="btn-press rounded border px-3 py-1.5 text-xs hover:bg-gray-50"
                          href={r.shortUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open
                        </a>
                      )}
                      <Link
                        className="btn-press rounded border px-3 py-1.5 text-xs hover:bg-gray-50"
                        href={`/agents/${r.id}`}
                      >
                        View stats
                      </Link>
                      <Link
                        className="btn-press rounded border px-3 py-1.5 text-xs hover:bg-gray-50"
                        href={`/agents/${r.id}/edit`}
                      >
                        Manage
                      </Link>
                      <button
                        className="btn-press rounded border px-3 py-1.5 text-xs hover:bg-gray-50"
                        data-edit-agent={r.id}
                        data-agent-name={r.name}
                        data-agent-notes={r.notes || ""}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-press rounded border px-3 py-1.5 text-xs hover:bg-gray-50"
                        data-reassign-zone={r.id}
                      >
                        Reassign zone
                      </button>
                      {r.linkId && (
                        <button
                          className="btn-press rounded border px-3 py-1.5 text-xs hover:bg-gray-50"
                          data-edit-link={r.linkId}
                          data-url={r.redirectUrl || ""}
                        >
                          Edit link
                        </button>
                      )}
                      <button
                        className="btn-press rounded border px-3 py-1.5 text-xs hover:bg-gray-50"
                        data-delete-agent={r.id}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td className="px-4 py-10 text-center text-gray-600" colSpan={4}>
                  No agents found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Global modals */}
      <EditAgentModal state={editAgent} close={() => setEditAgent(null)} />
      <EditLinkModal state={editLink} close={() => setEditLink(null)} />
      <ReassignZoneModal state={rezone} close={() => setRezone(null)} />
    </div>
  );
}
