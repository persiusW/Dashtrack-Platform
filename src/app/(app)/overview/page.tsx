import PageHeader from "@/components/dashboard/PageHeader";
import KpiCard from "@/components/dashboard/KpiCard";

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
          <a
            href="/app/activations/new"
            className="btn-press rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-900"
          >
            Create activation
          </a>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard label="Valid clicks (7d)" value={clicks} delta="+8% vs prev" spark={[10, 14, 12, 18, 20, 22, 28, 30]} />
        <KpiCard label="Active agents" value={agents} spark={[2, 4, 8, 16, 21, 25, 30]} />
        <KpiCard label="Active zones" value={zones} spark={[3, 4, 6, 8, 9, 10, 12, 14]} />
      </div>
    </div>
  );
}