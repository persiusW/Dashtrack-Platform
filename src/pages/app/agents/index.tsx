
import { AppLayout } from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, ExternalLink, Copy } from "lucide-react";

export default function AgentsPage() {
  const agents = [
    {
      id: "1",
      name: "John Smith",
      email: "john.smith@example.com",
      phone: "+1 234 567 8900",
      active: true,
      zones: ["Downtown Store", "Mall Location"],
      clicks: 345,
      public_token: "abc123def456",
    },
    {
      id: "2",
      name: "Sarah Johnson",
      email: "sarah.j@example.com",
      phone: "+1 234 567 8901",
      active: true,
      zones: ["Airport Terminal"],
      clicks: 289,
      public_token: "xyz789uvw012",
    },
    {
      id: "3",
      name: "Mike Williams",
      email: "mike.w@example.com",
      phone: "+1 234 567 8902",
      active: false,
      zones: ["Downtown Store"],
      clicks: 156,
      public_token: "mno345pqr678",
    },
  ];

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/a/${token}`);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Agents
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your field agents
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Agent
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Agent Directory</CardTitle>
            <CardDescription>Search and manage all agents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search agents..." className="flex-1" />
            </div>

            <div className="space-y-3">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-lg">{agent.name}</h3>
                      <Badge
                        variant={agent.active ? "default" : "secondary"}
                        className={agent.active ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : ""}
                      >
                        {agent.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                      <div>Email: {agent.email}</div>
                      <div>Phone: {agent.phone}</div>
                      <div>Zones: {agent.zones.join(", ")}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <div className="text-right mr-4">
                      <p className="text-2xl font-bold">{agent.clicks}</p>
                      <p className="text-xs text-muted-foreground">total clicks</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyToken(agent.public_token)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy Link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/a/${agent.public_token}`, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
