import Link from "next/link";
import { DataTable } from "@/components/ui/DataTable";

export default function ZonesPage() {
  const rows = [
    { name: "Zone A", district: "District 1", agents: 6, clicks: 342 },
    { name: "Zone B", district: "District 3", agents: 4, clicks: 245 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Zones</h1>
      <div className="reveal flex flex-wrap items-center gap-2">
        <Link
          href="/app/zones/new"
          className="btn-press rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-900"
        >
          Add zone
        </Link>
        <Link
          href="/app/agents/new"
          className="btn-press rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Add agent
        </Link>
      </div>
      <DataTable
        columns={[
          { key: "name", label: "Zone" },
          { key: "district", label: "District" },
          { key: "agents", label: "Agents", className: "text-right" },
          { key: "clicks", label: "Valid clicks (7d)", className: "text-right" },
        ]}
        rows={rows}
      />
    </div>
  );
}
