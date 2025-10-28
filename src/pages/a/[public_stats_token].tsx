
import { useRouter } from "next/router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, QrCode, ExternalLink, BarChart3, Calendar, TrendingUp } from "lucide-react";
import { ThemeSwitch } from "@/components/ThemeSwitch";

export default function PublicAgentStatsPage() {
  const router = useRouter();
  const { public_stats_token } = router.query;

  const agent = {
    name: "John Smith",
    zones: ["Downtown Store", "Mall Location"],
    unique_link: `https://track.example.com/agent/${public_stats_token}`,
    total_clicks: 345,
    last_7_days_clicks: 87,
    today_clicks: 12,
  };

  const dailyData = [
    { date: "2024-10-22", clicks: 15 },
    { date: "2024-10-23", clicks: 18 },
    { date: "2024-10-24", clicks: 10 },
    { date: "2024-10-25", clicks: 22 },
    { date: "2024-10-26", clicks: 8 },
    { date: "2024-10-27", clicks: 12 },
    { date: "2024-10-28", clicks: 12 },
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(agent.unique_link);
  };

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
            {agent.name}
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
              <div className="text-2xl font-bold">{agent.total_clicks}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last 7 Days</CardTitle>
              <Calendar className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agent.last_7_days_clicks}</div>
              <p className="text-xs text-muted-foreground">Recent activity</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agent.today_clicks}</div>
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
              {dailyData.map((day) => (
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
                        style={{ width: `${(day.clicks / 25) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-8 text-right">
                      {day.clicks}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
              <div className="w-48 h-48 bg-white rounded-lg shadow-md flex items-center justify-center border-4 border-gray-200">
                <QrCode className="h-32 w-32 text-gray-400" />
              </div>
              <div className="w-full">
                <p className="text-sm text-muted-foreground mb-2">Your tracking link:</p>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded text-sm break-all">
                    {agent.unique_link}
                  </code>
                  <Button variant="outline" size="sm" onClick={handleCopyLink}>
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(agent.unique_link, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assigned Zones</CardTitle>
            <CardDescription>Your current work locations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {agent.zones.map((zone) => (
                <Badge key={zone} variant="secondary" className="px-3 py-1">
                  {zone}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            DashTrack Agent Performance Dashboard
          </p>
        </div>
      </div>
    </div>
  );
}
