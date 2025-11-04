
import { AppLayout } from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Users } from "lucide-react";
import Link from "next/link";

export default function ZonesPage() {
  const zones = [
    {
      id: "1",
      name: "Downtown Store",
      address: "123 Main St, City Center",
      activation: "Summer Campaign 2024",
      agents_count: 8,
      clicks: 1245,
    },
    {
      id: "2",
      name: "Mall Location",
      address: "456 Shopping Center Blvd",
      activation: "Summer Campaign 2024",
      agents_count: 12,
      clicks: 2103,
    },
    {
      id: "3",
      name: "Airport Terminal",
      address: "789 Airport Road",
      activation: "Fall Product Launch",
      agents_count: 5,
      clicks: 876,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Zones
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your activation zones
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Zone
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {zones.map((zone) => (
            <Link key={zone.id} href={`/app/zones/${zone.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                    {zone.name}
                  </CardTitle>
                  <CardDescription>{zone.address}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Activation</p>
                      <Badge variant="secondary" className="mt-1">
                        {zone.activation}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Users className="h-4 w-4 mr-1" />
                        {zone.agents_count} agents
                      </div>
                      <div className="font-semibold">
                        {zone.clicks.toLocaleString()} clicks
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
