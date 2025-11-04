
import { useState } from "react";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { AppLayout } from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import QuickCreateDialog from "@/components/QuickCreateDialog";
import { MapPin } from "lucide-react";

type Zone = {
  id: string;
  name: string;
  activation_id: string;
  address: string | null;
};

type ZonesPageProps = {
  orgMissing: boolean;
  activationsCount: number;
  zones: Zone[];
};

export const getServerSideProps: GetServerSideProps<ZonesPageProps> = async (ctx) => {
  const supabase = createPagesServerClient(ctx);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      redirect: { destination: "/login?next=/app/zones", permanent: false },
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
        zones: [],
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

  // If no activations, we don't need to load zones
  if (activationsCount === 0) {
    return {
      props: {
        orgMissing: false,
        activationsCount,
        zones: [],
      },
    };
  }

  // Load zones for this organization
  const { data: zonesData, error } = await supabase
    .from("zones")
    .select("id, name, activation_id, address")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      props: {
        orgMissing: false,
        activationsCount,
        zones: [],
      },
    };
  }

  return {
    props: {
      orgMissing: false,
      activationsCount,
      zones: (zonesData || []) as Zone[],
    },
  };
};

export default function ZonesPage({ orgMissing, activationsCount, zones }: ZonesPageProps) {
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
            to start creating activations and zones.
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
              Create an activation to start creating and managing zones.
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Zones</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Browse zones across your activations
            </p>
          </div>
          <Button onClick={() => setOpen(true)}>Create Activation</Button>
        </div>

        {zones.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            No zones yet. Create links and assign agents after creating an activation.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {zones.map((zone) => (
              <Link
                key={zone.id}
                href={`/app/activations/${zone.activation_id}/zones/${zone.id}`}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="line-clamp-1">{zone.name}</CardTitle>
                    </div>
                    {zone.address && (
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">{zone.address}</span>
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      View details and performance
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <QuickCreateDialog open={open} onClose={() => setOpen(false)} />
    </AppLayout>
  );
}
  