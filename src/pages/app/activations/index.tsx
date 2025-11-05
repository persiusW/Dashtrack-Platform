
import { useState } from "react";
import type { GetServerSideProps } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import { AppLayout } from "@/components/layouts/AppLayout";
import GuidedCreateDialog from "@/components/GuidedCreateDialog";

type Activation = {
  id: string;
  name: string;
  status: string | null;
  created_at: string | null;
};

type ActivationsProps = {
  organizationId: string | null;
  activations: Activation[];
};

export const getServerSideProps: GetServerSideProps<ActivationsProps> = async (ctx) => {
  const supabase = createPagesServerClient(ctx);

  const { data: sessionRes } = await supabase.auth.getSession();
  if (!sessionRes?.session) {
    return { redirect: { destination: "/login?next=/app/activations", permanent: false } };
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

    organizationId = ownedOrg?.id ?? null;
  }

  let activations: Activation[] = [];
  if (organizationId) {
    const { data } = await supabase
      .from("activations")
      .select("id, name, status, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });
    activations = (data as Activation[]) || [];
  }

  return {
    props: {
      organizationId,
      activations,
    },
  };
};

export default function ActivationsPage({ organizationId, activations }: ActivationsProps) {
  if (!organizationId) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto text-center mt-16">
          <h2 className="text-2xl font-semibold">No organization</h2>
          <p className="mt-2 text-gray-600">Create your organization in Settings first.</p>
          <Link href="/app/settings" className="inline-block mt-6 bg-black text-white px-4 py-2 rounded">
            Go to Settings
          </Link>
        </div>
      </AppLayout>
    );
  }

  if (!activations || activations.length === 0) {
    return (
      <AppLayout>
        <EmptyCreateActivation />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Activations</h1>
          <CreateButton />
        </div>
        <div className="grid gap-3">
          {activations.map((a) => {
            const ts = a.created_at ? new Date(a.created_at).toISOString().replace("T", " ").slice(0, 16) : "";
            return (
              <Link
                key={a.id}
                href={`/app/activations/${a.id}`}
                className="block rounded-xl border p-4 bg-white hover:bg-gray-50"
              >
                <div className="font-medium">{a.name}</div>
                <div className="text-xs text-gray-600 mt-1">{ts}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}

function CreateButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="bg-black text-white px-4 py-2 rounded" onClick={() => setOpen(true)}>
        Create Activation
      </button>
      <GuidedCreateDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function EmptyCreateActivation() {
  const [open, setOpen] = useState(false);
  return (
    <div className="max-w-xl mx-auto text-center mt-16">
      <h2 className="text-2xl font-semibold">Create your first activation</h2>
      <p className="mt-2 text-gray-600">You have no activations yet.</p>
      <button className="mt-6 bg-black text-white px-4 py-2 rounded" onClick={() => setOpen(true)}>
        Create Activation
      </button>
      <GuidedCreateDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
