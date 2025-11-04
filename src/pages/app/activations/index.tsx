
import { useState } from "react";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { AppLayout } from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, MapPin, Users } from "lucide-react";
import QuickCreateDialog from "@/components/QuickCreateDialog";

type Activation = {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
  status: string | null;
  start_at: string | null;
  end_at: string | null;
};

type ActivationsPageProps = {
  orgMissing: boolean;
  activations: Activation[];
};

export const getServerSideProps: GetServerSideProps<ActivationsPageProps> = async (ctx) => {
  const supabase = createPagesServerClient(ctx);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      redirect: { destination: "/login?next=/app/activations", permanent: false },
    };
  }

  // Resolve organization_id from users table (primary source in this codebase)
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
    // No organization linked yet
    return {
      props: {
        orgMissing: true,
        activations: [],
      },
    };
  }

  // Fetch real activations for this organization
  const { data: activationsData, error } = await supabase
    .from("activations")
    .select("id, name, description, type, status, start_at, end_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    // If read fails, just show empty safe state (better than crashing UI)
    return {
      props: {
        orgMissing: false,
        activations: [],
      },
    };
  }

  return {
    props: {
      orgMissing: false,
      activations: (activationsData || []) as Activation[],
    },
  };
};

function getStatusColor(status: string | null | undefined) {
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
}

function isoDate(d: string | null) {
  if (!d) return "-";
  try {
    return new Date(d).toISOString().split("T")[0];
  } catch {
    return "-";
  }
}

export default function ActivationsPage({ orgMissing, activations }: ActivationsPageProps) {
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
            to start creating activations.
          </p>
        </div>
      </AppLayout>
    );
  }

  if (!activations || activations.length === 0) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="mx-auto max-w-2xl text-center bg-white dark:bg-gray-800 border rounded-xl p-10">
            <h1 className="text-2xl font-bold">Create your first activation</h1>
            <p className="text-muted-foreground mt-2">
              We&apos;ll generate zones, agents, and trackable links automatically.
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Activations
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your marketing activations
            </p>
          </div>
          <Button onClick={() => setOpen(true)}>
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
                      {activation.status || "draft"}
                    </Badge>
                  </div>
                  {activation.description && (
                    <CardDescription className="line-clamp-2">
                      {activation.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {isoDate(activation.start_at)}{" "}
                      {activation.end_at ? `– ${isoDate(activation.end_at)}` : ""}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      Zones and agents details available inside
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Users className="h-4 w-4 mr-2" />
                      Open to view performance
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <QuickCreateDialog open={open} onClose={() => setOpen(false)} />
    </AppLayout>
  );
}
  