import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { GlobalFilters } from "@/components/dashboard/GlobalFilters";
import { KPICard } from "@/components/dashboard/KPICard";
import { TimeSeriesChart } from "@/components/dashboard/TimeSeriesChart";
import { TopPerformersCard } from "@/components/dashboard/TopPerformersCard";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import {
  dashboardService,
  KPIData,
  TimeSeriesData,
  TopZone,
  TopAgent,
} from "@/services/dashboardService";
import { MousePointerClick, CheckCircle2, Users, Zap } from "lucide-react";

export default function OverviewPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { filters, setFilters, dateRangeOptions } = useGlobalFilters();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([]);
  const [topZones, setTopZones] = useState<TopZone[]>([]);
  const [topAgents, setTopAgents] = useState<TopAgent[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const [kpiData, timeSeriesData, zonesData, agentsData] = await Promise.all([
            dashboardService.getOverviewKPIs(filters.dateFrom, filters.dateTo),
            dashboardService.getTimeSeriesData(filters.dateFrom, filters.dateTo, filters.activationId),
            dashboardService.getTopZones(filters.dateFrom, filters.dateTo),
            dashboardService.getTopAgents(filters.dateFrom, filters.dateTo),
          ]);

          setKpis(kpiData);
          setTimeSeries(timeSeriesData);
          setTopZones(zonesData);
          setTopAgents(agentsData);
        } catch (error) {
          console.error("Failed to load dashboard data:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user, filters]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Overview Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your campaign performance and key metrics
          </p>
        </div>

        <GlobalFilters />

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KPICard
                title="Total Clicks"
                value={kpis?.totalClicks || 0}
                icon={MousePointerClick}
                description="All clicks received"
              />
              <KPICard
                title="Valid Clicks"
                value={kpis?.validClicks || 0}
                icon={CheckCircle2}
                description="Non-bot clicks"
              />
              <KPICard
                title="Active Agents"
                value={kpis?.totalAgents || 0}
                icon={Users}
                description="Currently active"
              />
              <KPICard
                title="Live Activations"
                value={kpis?.activeActivations || 0}
                icon={Zap}
                description="Active campaigns"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <TimeSeriesChart data={timeSeries} />
              </div>
              <div>
                <TopPerformersCard
                  title="Top Zones"
                  items={topZones.map((zone) => ({
                    id: zone.id,
                    name: zone.name,
                    value: zone.validClicks,
                  }))}
                  emptyMessage="No zone data available"
                />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <TopPerformersCard
                title="Top Agents"
                items={topAgents.map((agent) => ({
                  id: agent.id,
                  name: agent.name,
                  value: agent.validClicks,
                  link: `/a/${agent.publicStatsToken}`,
                }))}
                emptyMessage="No agent data available"
              />
              <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Top NFC Taglines</h3>
                <div className="text-center py-8 text-muted-foreground">
                  Coming in v2
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
}
