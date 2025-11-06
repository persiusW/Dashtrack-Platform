import Link from "next/link";
import PageHeader from "@/components/dashboard/PageHeader";
import { KPICard } from "@/components/dashboard/KPICard";
import { MousePointerClick, Users, Layers } from "lucide-react";

export default async function OverviewPage() {
  const clicks = 2105;
  const agents = 48;
  const zones = 14;

  return (
    <div className="space-y-6">
      <PageHeader
        icon="overview"
        title="Overview"
        subtitle="Key performance from the last 7 days"
        actions={
          <Link
            href="/activations"
            className="btn-press rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-900"
          >
            Create activation
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KPICard title="Valid clicks (7d)" value={clicks} icon={MousePointerClick} />
        <KPICard title="Active agents" value={agents} icon={Users} />
        <KPICard title="Active zones" value={zones} icon={Layers} />
      </div>

      <QuickActions />

      <Panels />
    </div>
  );
}

function QuickActions() {
  return (
    <div className="reveal flex flex-wrap items-center gap-2">
      <Link
        href="/activations"
        className="btn-press rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-900"
      >
        Create activation
      </Link>
      <Link
        href="/districts"
        className="btn-press rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
      >
        Manage districts
      </Link>
      <Link
        href="/zones"
        className="btn-press rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
      >
        Add zones
      </Link>
      <Link
        href="/app/agents"
        className="btn-press rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
      >
        Add agents
      </Link>
    </div>
  );
}

function Panels() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="reveal rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 text-lg font-semibold">Top zones (7d)</div>
        <List
          rows={[
            { name: "Zone A — District 1", metric: "342 clicks" },
            { name: "Zone C — District 2", metric: "298 clicks" },
            { name: "Zone B — District 3", metric: "245 clicks" },
          ]}
        />
      </div>
      <div className="reveal rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 text-lg font-semibold">Top agents (7d)</div>
        <List
          rows={[
            { name: "Mariam K.", metric: "152 clicks" },
            { name: "Samuel O.", metric: "144 clicks" },
            { name: "Kwesi A.", metric: "126 clicks" },
          ]}
        />
      </div>
    </div>
  );
}

function List({ rows }: { rows: { name: string; metric: string }[] }) {
  return (
    <ul className="divide-y divide-gray-100">
      {rows.map((r, i) => (
        <li key={i} className="flex items-center justify-between py-3">
          <div className="text-sm">{r.name}</div>
          <div className="text-sm text-gray-600">{r.metric}</div>
        </li>
      ))}
    </ul>
  );
}
