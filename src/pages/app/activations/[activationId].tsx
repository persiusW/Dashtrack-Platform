import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlobalFilters } from "@/components/dashboard/GlobalFilters";
import { KPICard } from "@/components/dashboard/KPICard";
import { TimeSeriesChart } from "@/components/dashboard/TimeSeriesChart";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import {
  dashboardService,
  KPIData,
  TimeSeriesData,
  ZonePerformance,
  AgentPerformance,
} from "@/services/dashboardService";
import { trackedLinkService, TrackedLink } from "@/services/trackedLinkService";
import { activationService, Activation } from "@/services/activationService";
import { MousePointerClick, CheckCircle2, Users, Link as LinkIcon, Copy, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layouts/AppLayout";

export default function ActivationDetailsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { activationId } = router.query;
  const { filters } = useGlobalFilters();

  const [activation, setActivation] = useState<any>(null);
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([]);
  const [zonePerformance, setZonePerformance] = useState<ZonePerformance[]>([]);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [links, setLinks] = useState<TrackedLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchActivation = async () => {
      if (typeof activationId !== "string") return;

      try {
        setLoading(true);
        const [activationData, kpiData, timeSeriesData, zonesData, agentsData, linksData] = await Promise.all([
          activationService.getActivation(activationId),
          dashboardService.getActivationKPIs(activationId, filters.dateFrom, filters.dateTo),
          dashboardService.getTimeSeriesData(filters.dateFrom, filters.dateTo, activationId),
          dashboardService.getZonePerformance(activationId, filters.dateFrom, filters.dateTo),
          dashboardService.getAgentPerformance(activationId, filters.dateFrom, filters.dateTo),
          trackedLinkService.getLinksByActivation(activationId),
        ]);

        setActivation(activationData);
        setKpis(kpiData);
        setTimeSeries(timeSeriesData);
        setZonePerformance(zonesData);
        setAgentPerformance(agentsData);
        setLinks(linksData);
      } catch (error) {
        console.error("Failed to load activation data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (activationId) {
      fetchActivation();
    }
  }, [activationId, filters]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard",
    });
  };

  const downloadCSV = async (type: "zones" | "agents") => {
    try {
      const response = await fetch(`/api/reports/export-${type}?activationId=${activationId}&dateFrom=${filters.dateFrom}&dateTo=${filters.dateTo}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-report-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download CSV:", error);
      toast({
        title: "Error",
        description: "Failed to download report",
        variant: "destructive",
      });
    }
  };

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="p-8">Loading activation details...</div>
      </AppLayout>
    );
  }

  if (!activation) {
    return (
      <AppLayout>
        <div className="p-8">Activation not found</div>
      </AppLayout>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{activation?.name || "Activation"}</h1>
        <p className="text-muted-foreground mt-1">{activation?.description}</p>
      </div>

      <GlobalFilters />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="zones">Zones</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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
              title="Total Agents"
              value={kpis?.totalAgents || 0}
              icon={Users}
              description="Assigned agents"
            />
            <KPICard
              title="Total Links"
              value={links.length}
              icon={LinkIcon}
              description="Tracked links"
            />
          </div>
          <TimeSeriesChart data={timeSeries} />
        </TabsContent>

        <TabsContent value="zones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Zone Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zone Name</TableHead>
                    <TableHead>Total Clicks</TableHead>
                    <TableHead>Valid Clicks</TableHead>
                    <TableHead>Unique Visitors</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zonePerformance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No zone data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    zonePerformance.map((zone) => (
                      <TableRow key={zone.zoneId}>
                        <TableCell className="font-medium">{zone.zoneName}</TableCell>
                        <TableCell>{zone.totalClicks}</TableCell>
                        <TableCell>{zone.validClicks}</TableCell>
                        <TableCell>{zone.uniqueVisitors}</TableCell>
                        <TableCell>
                          <Link href={`/app/activations/${activationId}/zones/${zone.zoneId}`}>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent Name</TableHead>
                    <TableHead>Total Clicks</TableHead>
                    <TableHead>Valid Clicks</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agentPerformance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No agent data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    agentPerformance.map((agent) => (
                      <TableRow key={agent.agentId}>
                        <TableCell className="font-medium">{agent.agentName}</TableCell>
                        <TableCell>{agent.totalClicks}</TableCell>
                        <TableCell>{agent.validClicks}</TableCell>
                        <TableCell>
                          <Link href={`/a/${agent.publicStatsToken}`} target="_blank">
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Public Page
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tracked Links</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Slug</TableHead>
                    <TableHead>Strategy</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No links available
                      </TableCell>
                    </TableRow>
                  ) : (
                    links.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell className="font-medium font-mono">{link.slug}</TableCell>
                        <TableCell className="capitalize">{link.destination_strategy}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${link.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                            {link.is_active ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(`${window.location.origin}/l/${link.slug}`)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">Zone Performance Report</h3>
                  <p className="text-sm text-muted-foreground">
                    Export detailed zone performance metrics as CSV
                  </p>
                </div>
                <Button onClick={() => downloadCSV("zones")}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Zones
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">Agent Performance Report</h3>
                  <p className="text-sm text-muted-foreground">
                    Export detailed agent performance metrics as CSV
                  </p>
                </div>
                <Button onClick={() => downloadCSV("agents")}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Agents
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
