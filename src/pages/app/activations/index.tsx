
import { AppLayout } from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, MapPin, Users } from "lucide-react";
import Link from "next/link";

export default function ActivationsPage() {
  const activations = [
    {
      id: "1",
      name: "Summer Campaign 2024",
      description: "Promotional campaign for summer products",
      type: "multi",
      status: "live",
      start_at: "2024-06-01",
      end_at: "2024-08-31",
      zones_count: 12,
      agents_count: 45,
    },
    {
      id: "2",
      name: "Fall Product Launch",
      description: "New product line launch activation",
      type: "single",
      status: "draft",
      start_at: "2024-09-15",
      end_at: "2024-10-31",
      zones_count: 5,
      agents_count: 20,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case "paused":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "ended":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Activations
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your marketing activations
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Activation
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activations.map((activation) => (
            <Link key={activation.id} href={`/app/activations/${activation.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="line-clamp-1">{activation.name}</CardTitle>
                    <Badge className={getStatusColor(activation.status)}>
                      {activation.status}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {activation.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(activation.start_at).toLocaleDateString()} -{" "}
                      {new Date(activation.end_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      {activation.zones_count} zones
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Users className="h-4 w-4 mr-2" />
                      {activation.agents_count} agents
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
