import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/layouts/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Building2, Users, UserCheck, MousePointerClick, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminOverviewPage() {
    const { user, isLoading: authLoading, supabase } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        organizations: 0,
        users: 0,
        activeAgents: 0,
        totalClicks: 0
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/");
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            checkAdminAccess(user.id);
        }
    }, [user]);

    const checkAdminAccess = async (userId: string) => {
        const { data: userData } = await supabase
            .from("users")
            .select("role")
            .eq("id", userId)
            .single();

        if (userData?.role !== "admin") {
            toast({
                title: "Access Denied",
                description: "You do not have permission to access this page",
                variant: "destructive",
            });
            router.push("/app/overview");
            return;
        }

        loadDashboardMetrics();
    };

    const loadDashboardMetrics = async () => {
        try {
            setLoading(true);

            const [orgsRes, usersRes, agentsRes, clicksRes] = await Promise.all([
                supabase.from("organizations").select("*", { count: "exact", head: true }),
                supabase.from("users").select("*", { count: "exact", head: true }),
                supabase.from("agents").select("*", { count: "exact", head: true }).eq("active", true),
                supabase.from("clicks").select("*", { count: "exact", head: true })
            ]);

            setMetrics({
                organizations: orgsRes.count || 0,
                users: usersRes.count || 0,
                activeAgents: agentsRes.count || 0,
                totalClicks: clicksRes.count || 0
            });

        } catch (error) {
            console.error("Failed to load dashboard metrics:", error);
            toast({
                title: "Error",
                description: "Failed to load dashboard metrics",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || !user || loading) {
        return (
            <AppLayout variant="simple">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
                        <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout variant="simple">
            <div className="container mx-auto p-4 md:p-6 space-y-6 flex-1">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
                        <p className="text-muted-foreground mt-1">Platform-wide analytics and system overview</p>
                    </div>
                    <Button onClick={loadDashboardMetrics} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pt-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{metrics.organizations}</div>
                            <p className="text-xs text-muted-foreground mt-1">Registered businesses</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{metrics.users}</div>
                            <p className="text-xs text-muted-foreground mt-1">Platform-wide seats</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{metrics.activeAgents}</div>
                            <p className="text-xs text-muted-foreground mt-1">Currently distributing links</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Tracks</CardTitle>
                            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{metrics.totalClicks.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">Recorded smart link hits</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 pt-4">
                    <Card className="col-span-full">
                        <CardHeader>
                            <CardTitle>System Health & Monetization</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500">Paystack integration is required to calculate accurate recurring revenue parameters. Platform limitations can be managed in the Pricing & Plans tab.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
