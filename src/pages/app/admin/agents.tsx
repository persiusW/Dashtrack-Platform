import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { UserCheck, ShieldOff, ShieldCheck } from "lucide-react";

type Agent = {
    id: string;
    name: string;
    phone_number: string;
    active: boolean;
    created_at: string;
    organization: {
        name: string;
    };
};

export default function AdminAgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user, isLoading: authLoading, supabase } = useAuth();
    const router = useRouter();

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

        loadAgents();
    };

    const loadAgents = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from("agents")
                .select(`
          id,
          name,
          phone_number,
          active,
          created_at,
          organization:organizations(name)
        `)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setAgents(data as unknown as Agent[]);
        } catch (error) {
            console.error("Failed to load agents:", error);
            toast({
                title: "Error",
                description: "Failed to load agents",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const toggleAgentStatus = async (agentId: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from("agents")
                .update({ active: !currentStatus })
                .eq("id", agentId);

            if (error) throw error;

            toast({
                title: "Success",
                description: `Agent ${!currentStatus ? 'enabled' : 'disabled'} successfully.`,
            });

            loadAgents();
        } catch (error) {
            console.error("Failed to update agent status:", error);
            toast({
                title: "Error",
                description: "Failed to update agent status",
                variant: "destructive",
            });
        }
    };

    if (authLoading || !user || isLoading) {
        return (
            <AppLayout variant="simple">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
                        <p className="mt-4 text-muted-foreground">Loading agents...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout variant="simple">
            <div className="container mx-auto p-4 md:p-6 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Agents Management</h1>
                    <p className="text-muted-foreground mt-1">Platform-wide overview of all distribution agents</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserCheck className="h-5 w-5" />
                            All Agents
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Organization</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {agents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No agents found on the platform
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    agents.map((agent) => (
                                        <TableRow key={agent.id}>
                                            <TableCell className="font-medium">{agent.name}</TableCell>
                                            <TableCell>{agent.phone_number || "N/A"}</TableCell>
                                            <TableCell>{agent.organization?.name || "N/A"}</TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded text-xs ${agent.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {agent.active ? 'Active' : 'Disabled'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(agent.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant={agent.active ? "destructive" : "default"}
                                                    size="sm"
                                                    onClick={() => toggleAgentStatus(agent.id, agent.active)}
                                                >
                                                    {agent.active ? (
                                                        <>
                                                            <ShieldOff className="h-4 w-4 mr-2" />
                                                            Disable
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ShieldCheck className="h-4 w-4 mr-2" />
                                                            Enable
                                                        </>
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
