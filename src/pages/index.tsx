
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Database, Shield, Clock, Folder } from "lucide-react";

export default function HomePage() {
  const features = [
    {
      icon: Database,
      title: "Multi-Tenant Database",
      description: "Complete PostgreSQL schema with organizations, users, activations, zones, agents, and tracking",
      status: "Ready"
    },
    {
      icon: Shield,
      title: "Row-Level Security",
      description: "Comprehensive RLS policies for secure data isolation across tenants with role-based access",
      status: "Configured"
    },
    {
      icon: Folder,
      title: "QR Storage",
      description: "Private storage bucket with signed URL access for QR code management",
      status: "Active"
    },
    {
      icon: Clock,
      title: "Data Retention",
      description: "Automated monthly cleanup of old click data with metric preservation",
      status: "Scheduled"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <Database className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              DashTrack
            </h1>
          </div>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Multi-tenant SaaS backend for intelligent link tracking and campaign management
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Backend Ready
            </Badge>
            <Badge variant="outline" className="border-blue-500 text-blue-700 dark:text-blue-400">
              Supabase Connected
            </Badge>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <feature.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {feature.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Database Schema Overview */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Database Schema
            </CardTitle>
            <CardDescription>
              Complete multi-tenant architecture with 9 core tables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { name: "organizations", desc: "Tenant roots" },
                { name: "users", desc: "Role-based access" },
                { name: "activations", desc: "Campaign management" },
                { name: "zones", desc: "Geographic tracking" },
                { name: "agents", desc: "External staff" },
                { name: "zone_agents", desc: "Agent assignments" },
                { name: "tracked_links", desc: "Smart redirects" },
                { name: "clicks", desc: "Event tracking" },
                { name: "daily_metrics", desc: "Aggregated stats" }
              ].map((table, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"
                >
                  <div className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {table.name}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {table.desc}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Next steps: Implement frontend dashboard, agent portal, and public stats pages
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <a
              href="/docs"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View Documentation →
            </a>
            <a
              href="https://github.com/supabase/supabase"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            >
              Supabase Docs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
