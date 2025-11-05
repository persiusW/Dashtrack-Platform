
import { useState } from "react";
import type { GetServerSideProps } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import { AppLayout } from "@/components/layouts/AppLayout";
import QuickCreateDialog from "@/components/QuickCreateDialog";

type Zone = {
  id: string;
  name: string;
  activation_id: string;
  created_at: string | null;
};

type ZonesProps = {
  organizationId: string | null;
  activationCount: number;
  zones: Zone[];
};

export const getServerSideProps: GetServerSideProps<ZonesProps> = async (ctx) => {
  const supabase = createPagesServerClient(ctx);

  const { data: sessionRes } = await supabase.auth.getSession();
  if (!sessionRes?.session) {
    return { redirect: { destination: "/login?next=/app/zones", permanent: false } };
  }

  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes?.user?.id || null;

  let organizationId: string | null = null;

  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .maybeSingle();
    organizationId = profile?.organization_id ?? null;
  }

  if (!organizationId && userId) {
    const { data: ownedOrg } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    organizationId = ownedOrg?.id ?? null;
  }

  let activationCount = 0;
  let zones: Zone[] = [];

  if (organizationId) {
    const { count } = await supabase
      .from("activations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId);
    activationCount = count ?? 0;

    if (activationCount > 0) {
      const { data } = await supabase
        .from("zones")
        .select("id, name, activation_id, created_at")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });
      zones = (data as Zone[]) || [];
    }
  }

  return {
    props: { organizationId, activationCount, zones },
  };
};

export default function ZonesPage({ organizationId, activationCount, zones }: ZonesProps) {
  if (!organizationId || activationCount === 0) {
    return (
      <AppLayout>
        <NoActivationsMessage />
      </AppLayout>
    );
  }

  if (!zones || zones.length === 0) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto text-center mt-16">
          <h2 className="text-2xl font-semibold">No zones yet</h2>
          <p className="mt-2 text-gray-600">Zones are created when you set up activations and can be managed later.</p>
          <NoActivationsMessageInner />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Zones</h1>
        </div>
        <div className="grid gap-3">
          {zones.map((z) => {
            const ts = z.created_at ? new Date(z.created_at).toISOString().replace("T", " ").slice(0, 16) : "";
            return (
              <Link
                key={z.id}
                href={`/app/zones/${z.id}`}
                className="block rounded-xl border p-4 bg-white hover:bg-gray-50"
              >
                <div className="font-medium">{z.name}</div>
                <div className="text-xs text-gray-600 mt-1">{ts}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}

function NoActivationsMessageInner() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-6">
      <button className="bg-black text-white px-4 py-2 rounded" onClick={() => setOpen(true)}>
        Create Activation
      </button>
      <QuickCreateDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function NoActivationsMessage() {
  return (
    <div className="max-w-xl mx-auto text-center mt-16">
      <h2 className="text-2xl font-semibold">No activations yet</h2>
      <p className="mt-2 text-gray-600">Create an activation to manage zones.</p>
      <NoActivationsMessageInner />
    </div>
  );
}
  