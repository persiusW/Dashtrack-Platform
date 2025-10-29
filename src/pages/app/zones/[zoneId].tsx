
import { AppLayout } from "@/components/layouts/AppLayout";
import { useRouter } from "next/router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Link2, Edit, BarChart3 } from "lucide-react";

export default function ZoneDetailPage() {
  const router = useRouter();
  const { zoneId } = router.query;

  const zone = {
    id: zoneId,
    name: "Downtown Store",
    address: "123 Main St, City Center",
    lat: 40.7128,
    lng: -74.0060,
    activation: "Summer Campaign 2024",
    agents_count: 8,
    total_clicks: 1245,
    unique_clicks: 892,
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <MapPin className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {zone.name}
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">{zone.address}</p>
            <Badge variant="secondary" className="mt-2">
              {zone.activation}
            </Badge>
          </div>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit Zone
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{zone.total_clicks.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+15% from last week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{zone.unique_clicks.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">71.6% conversion</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{zone.agents_count}</div>
              <p className="text-xs text-muted-foreground">All active</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Zone Information</CardTitle>
              <CardDescription>Location details and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p className="text-lg">{zone.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Latitude</p>
                  <p className="text-lg">{zone.lat}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Longitude</p>
                  <p className="text-lg">{zone.lng}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assigned Agents</CardTitle>
              <CardDescription>Agents working in this zone</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded border">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 mr-3" />
                      <div>
                        <p className="font-medium">Agent {i}</p>
                        <p className="text-sm text-muted-foreground">Active</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{(150 - i * 20)}</p>
                      <p className="text-xs text-muted-foreground">clicks</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Zone Stand Link</CardTitle>
            <CardDescription>QR code link for this zone</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Zone stand link configuration placeholder</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
