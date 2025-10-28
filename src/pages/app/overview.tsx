
import { AppLayout } from "@/components/layouts/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, MousePointerClick, Users, Link2 } from "lucide-react";
import { useSubscriptionGate } from "@/hooks/useSubscriptionGate";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function OverviewPage() {
  const { profile } = useAuth();
  const { plan } = useSubscriptionGate();

  const stats = [
    {
      title: "Total Clicks",
      value: "12,345",
      change: "+12.5%",
      icon: MousePointerClick,
      color: "text-blue-600",
    },
    {
      title: "Active Zones",
      value: "24",
      change: "+3",
      icon: BarChart3,
      color: "text-green-600",
    },
    {
      title: "Active Agents",
      value: "56",
      change: "+8",
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Tracked Links",
      value: "189",
      change: "+15",
      icon: Link2,
      color: "text-orange-600",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back, {profile?.role.replace("_", " ")}
          </p>
        </div>

        {plan === "free" && (
          <Alert>
            <AlertDescription>
              You are on the free plan. Upgrade to unlock advanced features and remove limitations.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.change} from last month
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Last 7 days of clicks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Time series chart placeholder
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Zones</CardTitle>
              <CardDescription>Highest performing zones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Zone {i}</p>
                      <p className="text-sm text-muted-foreground">
                        Location placeholder
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{1000 - i * 100}</p>
                      <p className="text-sm text-muted-foreground">clicks</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
