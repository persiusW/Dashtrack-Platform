
import { AppLayout } from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Users } from "lucide-react";

export default function AdminOrganizationsPage() {
  const organizations = [
    {
      id: "1",
      name: "Acme Corporation",
      plan: "enterprise",
      users_count: 45,
      activations_count: 12,
      created_at: "2024-01-15",
    },
    {
      id: "2",
      name: "TechStart Inc",
      plan: "pro",
      users_count: 12,
      activations_count: 5,
      created_at: "2024-03-22",
    },
    {
      id: "3",
      name: "Small Business Co",
      plan: "free",
      users_count: 3,
      activations_count: 1,
      created_at: "2024-06-10",
    },
  ];

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "enterprise":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "pro":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "free":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
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
              Organizations
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Admin: Manage all organizations
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Organization
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Organization Directory</CardTitle>
            <CardDescription>Search and manage all organizations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search organizations..." className="flex-1" />
            </div>

            <div className="space-y-3">
              {organizations.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-lg">{org.name}</h3>
                      <Badge className={getPlanColor(org.plan)}>
                        {org.plan.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {org.users_count} users
                      </div>
                      <div>{org.activations_count} activations</div>
                      <div>Created: {new Date(org.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Organizations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">3</div>
              <p className="text-sm text-muted-foreground mt-1">+1 this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enterprise Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">1</div>
              <p className="text-sm text-muted-foreground mt-1">33.3% of total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Free Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">1</div>
              <p className="text-sm text-muted-foreground mt-1">Conversion opportunity</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
