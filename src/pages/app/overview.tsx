import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { KPICard } from "@/components/dashboard/KPICard";
import { TimeSeriesChart } from "@/components/dashboard/TimeSeriesChart";
import { TopPerformersCard } from "@/components/dashboard/TopPerformersCard";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import {
  dashboardService,
  KPIData,
  TimeSeriesData,
  TopZone,
  TopAgent,
} from "@/services/dashboardService";
import { MousePointerClick, CheckCircle2, Users, Zap } from "lucide-react";
import type { GetServerSideProps } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import QuickCreateDialog from "@/components/QuickCreateDialog";
import Link from "next/link";
import GuidedCreateDialog from "@/components/GuidedCreateDialog";
import { CreateActivationDialog } from "@/components/forms/CreateActivationDialog";

type OverviewProps = {
  initialActivationsCount: number;
  organizationId: string | null;
};

export const getServerSideProps: GetServerSideProps<OverviewProps> = async (ctx) => {
  const supabase = createPagesServerClient(ctx);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      redirect: { destination: "/login?next=/app/overview", permanent: false },
    };
  }

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id || null;

  let organizationId: string | null = null;

  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.organization_id) {
      organizationId = profile.organization_id;
    }
  }

  if (!organizationId && userId) {
    const { data: ownedOrg } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (ownedOrg?.id) {
      organizationId = ownedOrg.id;
    }
  }

  if (!organizationId) {
    const metaOrg = (userData?.user as any)?.app_metadata?.organization_id as string | undefined;
    if (metaOrg) {
      organizationId = metaOrg;
    }
  }

  let activationsCount = 0;

  if (organizationId) {
    const { count } = await supabase
      .from("activations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId);

    activationsCount = count ?? 0;
  }

  return {
    props: {
      initialActivationsCount: activationsCount,
      organizationId,
    },
  };
};

export default function OverviewPage({ initialActivationsCount, organizationId }: OverviewProps) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { filters } = useGlobalFilters();

  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([]);
  const [topZones, setTopZones] = useState<TopZone[]>([]);
  const [topAgents, setTopAgents] = useState<TopAgent[]>([]);
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?next=/app/overview");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      if (!user || !organizationId) return;
      try {
        setLoading(true);
        const [kpiData, timeSeriesData, zonesData, agentsData] = await Promise.all([
          dashboardService.getOverviewKPIs(filters.dateFrom, filters.dateTo, organizationId),
          dashboardService.getTimeSeriesData(filters.dateFrom, filters.dateTo, organizationId, filters.activationId),
          dashboardService.getTopZones(filters.dateFrom, filters.dateTo, organizationId),
          dashboardService.getTopAgents(filters.dateFrom, filters.dateTo, organizationId),
        ]);

        if (cancelled) return;

        setKpis(kpiData);
        setTimeSeries(timeSeriesData);
        setTopZones(zonesData);
        setTopAgents(agentsData);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [user, filters, organizationId]);

  if (authLoading) {
    return (
      <AppLayout variant="simple">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!organizationId) {
    return (
      <AppLayout variant="simple">
        <div className="container mx-auto p-6">
          <div className="mx-auto max-w-2xl text-center bg-white dark:bg-gray-800 border rounded-xl p-10">
            <h1 className="text-2xl font-bold">Set up your organization</h1>
            <p className="text-muted-foreground mt-2">
              Create your organization in Settings, then launch your first activation.
            </p>
            <div className="mt-6">
              <Link href="/app/settings" className="inline-block bg-black text-white px-4 py-2 rounded">
                Go to Settings
              </Link>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (initialActivationsCount === 0) {
    return (
      <AppLayout variant="simple">
        <div className="container mx-auto p-6">
          <div className="mx-auto max-w-2xl text-center bg-white dark:bg-gray-800 border rounded-xl p-10">
            <h1 className="text-2xl font-bold">Create your first activation</h1>
            <p className="text-muted-foreground mt-2">
              You don&apos;t have any activations yet. Create one to start tracking zones, agents, and links.
            </p>
            <div className="mt-6">
              <Button onClick={() => setShowQuickCreate(true)}>Create Activation</Button>
            </div>
          </div>
        </div>

        <GuidedCreateDialog
          open={showQuickCreate}
          onClose={() => setShowQuickCreate(false)}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout variant="simple">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Overview Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Monitor your campaign performance and key metrics
            </p>
          </div>
          <CreateActivationDialog
            onCreated={(id) => {
              if (id) {
                window.location.assign(`/app/activations/${id}`);
              } else {
                window.location.reload();
              }
            }}
          />
        </div>

        {/* Topbar is rendered by AppLayout (simple variant) */}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KPICard
                title="Total Clicks"
                value={kpis?.totalClicks ?? 0}
                icon={MousePointerClick}
                description="All clicks received"
              />
              <KPICard
                title="Valid Clicks"
                value={kpis?.validClicks ?? 0}
                icon={CheckCircle2}
                description="Non-bot clicks"
              />
              <KPICard
                title="Active Agents"
                value={kpis?.totalAgents ?? 0}
                icon={Users}
                description="Currently active"
              />
              <KPICard
                title="Live Activations"
                value={kpis?.activeActivations ?? 0}
                icon={Zap}
                description="Active campaigns"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <TimeSeriesChart data={timeSeries} />
              </div>
              <div>
                <TopPerformersCard
                  title="Top Zones"
                  items={topZones.map((zone) => ({
                    id: zone.id,
                    name: zone.name,
                    value: zone.validClicks,
                  }))}
                  emptyMessage="No zone data available"
                />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <TopPerformersCard
                title="Top Agents"
                items={topAgents.map((agent) => ({
                  id: agent.id,
                  name: agent.name,
                  value: agent.validClicks,
                  link: `/a/${agent.publicStatsToken}`,
                }))}
                emptyMessage="No agent data available"
              />
              <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Top NFC Taglines</h3>
                <div className="text-center py-8 text-muted-foreground">
                  Coming in v2
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
