
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, QrCode, ExternalLink, BarChart3, Calendar, TrendingUp, Loader2 } from "lucide-react";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { supabase } from "@/integrations/supabase/client";
import { qrService } from "@/services/qrService";

interface AgentStats {
  agent_id: string;
  agent_name: string;
  total_clicks: number;
  total_valid_clicks: number;
  daily_stats: Array<{
    date: string;
    clicks: number;
    valid_clicks: number;
    uniques: number;
  }>;
}

interface AgentLink {
  id: string;
  slug: string;
  activation_id: string;
  zone_id: string | null;
  agent_id: string | null;
}

export default function PublicAgentStatsPage() {
  const router = useRouter();
  const { public_stats_token } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [agentLink, setAgentLink] = useState<AgentLink | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [zones, setZones] = useState<string[]>([]);

  useEffect(() => {
    if (public_stats_token && typeof public_stats_token === "string") {
      loadAgentData(public_stats_token);
    }
  }, [public_stats_token]);

  const loadAgentData = async (token: string) => {
    setLoading(true);
    setError(null);

    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 7);
      const toDate = new Date();

      const { data: statsData, error: statsError } = await supabase.rpc("public_agent_stats", {
        p_public_stats_token: token,
        p_from_date: fromDate.toISOString().split("T")[0],
        p_to_date: toDate.toISOString().split("T")[0]
      });

      if (statsError) throw statsError;

      if (!statsData || statsData.length === 0) {
        setError("Agent not found or no data available");
        return;
      }

      setStats(statsData[0]);

      const { data: linkData, error: linkError } = await supabase
        .from("tracked_links")
        .select("id, slug, activation_id, zone_id, agent_id")
        .eq("agent_id", statsData[0].agent_id)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (!linkError && linkData) {
        setAgentLink(linkData);

        try {
          const signedUrl = await qrService.getQRSignedUrl(
            linkData.id,
            linkData.activation_id,
            linkData.zone_id,
            linkData.agent_id
          );
          setQrUrl(signedUrl);
        } catch (qrError) {
          console.error("Failed to load QR code:", qrError);
        }
      }

      const { data: zoneAssignments } = await supabase
        .from("zone_agents")
        .select(`
          zones!zone_agents_zone_id_fkey (
            name
          )
        `)
        .eq("agent_id", statsData[0].agent_id);

      if (zoneAssignments && Array.isArray(zoneAssignments)) {
        const zoneNames = zoneAssignments
          .map((za: any) => za.zones?.name)
          .filter((name: any) => name);
        setZones(zoneNames);
      }
    } catch (err: any) {
      console.error("Error loading agent data:", err);
      setError(err.message || "Failed to load agent data");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (agentLink) {
      const link = `${window.location.origin}/r/${agentLink.slug}`;
      navigator.clipboard.writeText(link);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading agent stats...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error || "Agent not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const todayClicks = stats.daily_stats.find(
    (d) => d.date === new Date().toISOString().split("T")[0]
  )?.clicks || 0;

  const uniqueLink = agentLink ? `${window.location.origin}/r/${agentLink.slug}` : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="absolute top-4 right-4">
        <ThemeSwitch />
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white mb-4">
            <User className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {stats.agent_name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Field Agent Performance Dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_clicks}</div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valid Clicks</CardTitle>
              <Calendar className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_valid_clicks}</div>
              <p className="text-xs text-muted-foreground">Non-bot clicks</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayClicks}</div>
              <p className="text-xs text-muted-foreground">Current day</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Last 7 Days Activity</CardTitle>
            <CardDescription>Daily click performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.daily_stats.map((day) => {
                const maxClicks = Math.max(...stats.daily_stats.map((d) => d.clicks), 1);
                return (
                  <div key={day.date} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <div className="flex items-center space-x-3 flex-1 ml-4">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all"
                          style={{ width: `${(day.clicks / maxClicks) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-8 text-right">
                        {day.clicks}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {agentLink && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <QrCode className="h-5 w-5 mr-2 text-blue-600" />
                Your QR Code & Link
              </CardTitle>
              <CardDescription>Share this to track your interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div className="w-48 h-48 bg-white rounded-lg shadow-md flex items-center justify-center border-4 border-gray-200 overflow-hidden">
                  {qrUrl ? (
                    <img src={qrUrl} alt="QR Code" className="w-full h-full object-contain" />
                  ) : (
                    <QrCode className="h-32 w-32 text-gray-400" />
                  )}
                </div>
                <div className="w-full">
                  <p className="text-sm text-muted-foreground mb-2">Your tracking link:</p>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded text-sm break-all">
                      {uniqueLink}
                    </code>
                    <Button variant="outline" size="sm" onClick={handleCopyLink}>
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(uniqueLink, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {zones.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Assigned Zones</CardTitle>
              <CardDescription>Your current work locations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {zones.map((zone) => (
                  <Badge key={zone} variant="secondary" className="px-3 py-1">
                    {zone}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            DashTrack Agent Performance Dashboard
          </p>
        </div>
      </div>
    </div>
  );
}
