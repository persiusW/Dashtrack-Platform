
import { AppLayout } from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Copy, ExternalLink } from "lucide-react";

export default function LinksPage() {
  const links = [
    {
      id: "1",
      slug: "summer-promo",
      activation: "Summer Campaign 2024",
      zone: "Downtown Store",
      agent: "John Smith",
      strategy: "smart",
      clicks: 456,
      is_active: true,
    },
    {
      id: "2",
      slug: "fall-launch",
      activation: "Fall Product Launch",
      zone: "Mall Location",
      agent: null,
      strategy: "single",
      clicks: 234,
      is_active: true,
    },
    {
      id: "3",
      slug: "airport-special",
      activation: "Summer Campaign 2024",
      zone: "Airport Terminal",
      agent: "Sarah Johnson",
      strategy: "smart",
      clicks: 789,
      is_active: false,
    },
  ];

  const handleCopyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/l/${slug}`);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Tracked Links
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your tracking links
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Link
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Link Directory</CardTitle>
            <CardDescription>Search and manage all tracked links</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search links..." className="flex-1" />
            </div>

            <div className="space-y-3">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <code className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        /{link.slug}
                      </code>
                      <Badge
                        variant={link.is_active ? "default" : "secondary"}
                        className={link.is_active ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : ""}
                      >
                        {link.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {link.strategy}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                      <div>Activation: {link.activation}</div>
                      <div>Zone: {link.zone}</div>
                      <div>Agent: {link.agent || "Unassigned"}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <div className="text-right mr-4">
                      <p className="text-2xl font-bold">{link.clicks}</p>
                      <p className="text-xs text-muted-foreground">clicks</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(link.slug)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/l/${link.slug}`, "_blank")}
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
