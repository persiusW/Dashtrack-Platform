
import { AppLayout } from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Building2 } from "lucide-react";

export default function AdminUsersPage() {
  const users = [
    {
      id: "1",
      email: "admin@acme.com",
      role: "admin",
      organization: "Acme Corporation",
      created_at: "2024-01-15",
    },
    {
      id: "2",
      email: "manager@acme.com",
      role: "client_manager",
      organization: "Acme Corporation",
      created_at: "2024-02-01",
    },
    {
      id: "3",
      email: "supervisor@techstart.com",
      role: "zone_supervisor",
      organization: "TechStart Inc",
      created_at: "2024-03-22",
    },
    {
      id: "4",
      email: "manager@techstart.com",
      role: "client_manager",
      organization: "TechStart Inc",
      created_at: "2024-03-25",
    },
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "client_manager":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "zone_supervisor":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
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
              Users
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Admin: Manage all users across organizations
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New User
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Directory</CardTitle>
            <CardDescription>Search and manage all users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users..." className="flex-1" />
            </div>

            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-lg">{user.email}</h3>
                      <Badge className={getRoleColor(user.role)}>
                        {user.role.replace("_", " ").toUpperCase()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-1" />
                        {user.organization}
                      </div>
                      <div>Joined: {new Date(user.created_at).toLocaleDateString()}</div>
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
              <CardTitle>Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{users.length}</div>
              <p className="text-sm text-muted-foreground mt-1">Across all organizations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {users.filter((u) => u.role === "admin").length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">System administrators</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Client Managers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {users.filter((u) => u.role === "client_manager").length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Organization managers</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
