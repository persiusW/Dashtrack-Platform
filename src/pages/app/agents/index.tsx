
import { useState } from "react";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { AppLayout } from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import QuickCreateDialog from "@/components/QuickCreateDialog";
import { Users, Mail, Phone } from "lucide-react";

type Agent = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  active: boolean | null;
  public_stats_token: string;
};

type AgentsPageProps = {
  orgMissing: boolean;
  activationsCount: number;
  agents: Agent[];
};

export const getServerSideProps: GetServerSideProps<AgentsPageProps> = async (ctx) => {
  const supabase = createPagesServerClient(ctx);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      redirect: { destination: "/login?next=/app/agents", permanent: false },
    };
  }

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id || null;

  let organizationId: string | null = null;

  if (userId) {
    const { data: userRow } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", userId)
      .maybeSingle();
    if (userRow?.organization_id) {
      organizationId = userRow.organization_id;
    }
  }

  if (!organizationId) {
    return {
      props: {
        orgMissing: true,
        activationsCount: 0,
        agents: [],
      },
    };
  }

  // Count activations for this organization
  let activationsCount = 0;
  {
    const { count } = await supabase
      .from("activations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId);
    activationsCount = count ?? 0;
  }

  if (activationsCount === 0) {
    return {
      props: {
        orgMissing: false,
        activationsCount,
        agents: [],
      },
    };
  }

  // Load agents for this organization (no demo rows)
  const { data: agentsData, error } = await supabase
    .from("agents")
    .select("id, name, email, phone, active, public_stats_token")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });

  if (error) {
    return {
      props: {
        orgMissing: false,
        activationsCount,
        agents: [],
      },
    };
  }

  return {
    props: {
      orgMissing: false,
      activationsCount,
      agents: (agentsData || []) as Agent[],
    },
  };
};

export default function AgentsPage({ orgMissing, activationsCount, agents }: AgentsPageProps) {
  const [open, setOpen] = useState(false);

  if (orgMissing) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto text-center mt-16 bg-white dark:bg-gray-800 border rounded-xl p-10">
          <h2 className="text-2xl font-semibold">No organization</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Create your organization in{" "}
            <Link href="/app/settings" className="underline">
              Settings
            </Link>{" "}
            to start creating activations and adding agents.
          </p>
        </div>
      </AppLayout>
    );
  }

  if (activationsCount === 0) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="mx-auto max-w-2xl text-center bg-white dark:bg-gray-800 border rounded-xl p-10">
            <h1 className="text-2xl font-bold">No activations yet</h1>
            <p className="text-muted-foreground mt-2">
              Create an activation to add agents and generate trackable links.
            </p>
            <div className="mt-6">
              <Button onClick={() => setOpen(true)}>Create Activation</Button>
            </div>
          </div>
        </div>

        <QuickCreateDialog open={open} onClose={() => setOpen(false)} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Agents</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your field agents and their public stats pages
            </p>
          </div>
          <Button onClick={() => setOpen(true)}>Create Activation</Button>
        </div>

        {agents.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            No agents found yet. Create an activation to generate agents automatically or add them later.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="line-clamp-1 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {agent.name}
                    </CardTitle>
                  </div>
                  <CardDescription className="space-y-1">
                    {agent.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{agent.email}</span>
                      </div>
                    )}
                    {agent.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span className="truncate">{agent.phone}</span>
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Status: {agent.active ? "Active" : "Inactive"}
                  </div>
                  <Link
                    href={`/a/${agent.public_stats_token}`}
                    className="text-sm underline"
                  >
                    Public page
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <QuickCreateDialog open={open} onClose={() => setOpen(false)} />
    </AppLayout>
  );
}
  