
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { GlobalFilters } from "@/components/dashboard/GlobalFilters";
import { KPICard } from "@/components/dashboard/KPICard";
import { TimeSeriesChart } from "@/components/dashboard/TimeSeriesChart";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import {
  dashboardService,
  KPIData,
  TimeSeriesData,
  AgentPerformance,
} from "@/services/dashboardService";
import { zoneService, Zone } from "@/services/zoneService";
import { MousePointerClick, CheckCircle2, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function ZoneDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { activationId, zoneId } = router.query;
  const { filters } = useGlobalFilters();

  const [zone, setZone] = useState<Zone | null>(null);
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([]);
  const [agentLeaderboard, setAgentLeaderboard] = useState<AgentPerformance[]>([]);
  const [standLinkPerformance, setStandLinkPerformance] = useState<{
    standClicks: number;
    agentAverage: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && zoneId) {
      loadZoneData();
    }
  }, [user, zoneId, filters]);

  const loadZoneData = async () => {
    if (typeof zoneId !== "string" || typeof activationId !== "string") return;

    try {
      setLoading(true);
      const [zoneData, kpiData, timeSeriesData, agentsData] = await Promise.all([
        zoneService.getZoneById(zoneId),
        dashboardService.getZoneKPIs(zoneId, filters.dateFrom, filters.dateTo),
        dashboardService.getTimeSeriesData(filters.dateFrom, filters.dateTo, activationId, zoneId),
        dashboardService.getZoneAgentLeaderboard(zoneId, filters.dateFrom, filters.dateTo),
      ]);

      setZone(zoneData);
      setKpis(kpiData);
      setTimeSeries(timeSeriesData);
      setAgentLeaderboard(agentsData);

      if (zoneData.zone_stand_link_id) {
        const standPerf = await dashboardService.getZoneStandLinkPerformance(
          zoneId,
          filters.dateFrom,
          filters.dateTo
        );
        setStandLinkPerformance(standPerf);
      }
    } catch (error) {
      console.error("Failed to load zone data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{zone?.name || "Zone"}</h1>
          <p className="text-muted-foreground mt-1">{zone?.address}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push(`/app/links?zoneId=${zoneId}`)}>
            Create Link
          </Button>
          <Button variant="outline" onClick={() => router.push(`/app/agents?zoneId=${zoneId}`)}>
            Assign Agent
          </Button>
        </div>
      </div>

      <GlobalFilters />

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
          value={agentLeaderboard.length}
          icon={Users}
          description="Agents in this zone"
        />
        {standLinkPerformance && (
          <KPICard
            title="Stand vs Agents"
            value={`${standLinkPerformance.standClicks} / ${standLinkPerformance.agentAverage.toFixed(1)}`}
            icon={TrendingUp}
            description="Stand link / Agent avg"
          />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TimeSeriesChart data={timeSeries} title="Zone Performance Over Time" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Agent Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            {agentLeaderboard.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No agents assigned to this zone
              </div>
            ) : (
              <div className="space-y-3">
                {agentLeaderboard.map((agent, index) => (
                  <div key={agent.agentId} className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/a/${agent.publicStatsToken}`}
                        target="_blank"
                        className="text-sm font-medium hover:underline truncate block"
                      >
                        {agent.agentName}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {agent.validClicks} valid clicks
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {standLinkPerformance && (
        <Card>
          <CardHeader>
            <CardTitle>Zone Stand Link Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-muted-foreground mb-2">Stand Link Clicks</div>
                <div className="text-3xl font-bold">{standLinkPerformance.standClicks}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">Agent Average</div>
                <div className="text-3xl font-bold">{standLinkPerformance.agentAverage.toFixed(1)}</div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm">
                {standLinkPerformance.standClicks > standLinkPerformance.agentAverage ? (
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    Stand link is performing {((standLinkPerformance.standClicks / standLinkPerformance.agentAverage - 1) * 100).toFixed(1)}% better than agent average
                  </span>
                ) : (
                  <span className="text-orange-600 dark:text-orange-400 font-medium">
                    Stand link is performing {((1 - standLinkPerformance.standClicks / standLinkPerformance.agentAverage) * 100).toFixed(1)}% below agent average
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
