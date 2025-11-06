import type { GetServerSideProps } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import PageHeader from "@/components/dashboard/PageHeader";
import { AppLayout } from "@/components/layouts/AppLayout";
import { useCallback } from "react";
import { CreateActivationDialog } from "@/components/forms/CreateActivationDialog";

type ActivationRow = {
  id: string;
  name: string;
  default_redirect_url: string | null;
  redirect_android_url: string | null;
  redirect_ios_url: string | null;
  created_at: string | null;
};

type RedirectsPageProps = {
  organizationId: string | null;
  activations: ActivationRow[];
};

export const getServerSideProps: GetServerSideProps<RedirectsPageProps> = async (ctx) => {
  const supabase = createPagesServerClient(ctx);

  const { data: sessionRes } = await supabase.auth.getSession();
  if (!sessionRes?.session) {
    return { redirect: { destination: "/login?next=/app/links/redirects", permanent: false } };
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
    organizationId = (profile as any)?.organization_id ?? null;
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

  let activations: ActivationRow[] = [];
  if (organizationId) {
    const { data } = await supabase
      .from("activations")
      .select("id,name,default_redirect_url,redirect_android_url,redirect_ios_url,created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    activations = (data as ActivationRow[]) || [];
  }

  return {
    props: {
      organizationId,
      activations,
    },
  };
};

export default function LinksRedirectsPage({ organizationId, activations }: RedirectsPageProps) {
  const handleCreated = useCallback((id: string) => {
    if (id) {
      window.location.assign(`/app/activations/${id}`);
    } else {
      window.location.reload();
    }
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          icon="link"
          title="Activation Links"
          subtitle="Set main and platform-specific redirect URLs"
          actions={<CreateActivationDialog onCreated={handleCreated} />}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(activations || []).map((a) => (
            <ActivationCard key={a.id} act={a} />
          ))}
          {(!activations || !activations.length) && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-600">
              No activations yet.
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function ActivationCard({ act }: { act: ActivationRow }) {
  return (
    <form
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3"
      action={`/api/activations/${act.id}/redirects`}
      method="post"
      onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        fetch(e.currentTarget.action, {
          method: "PUT",
          body: JSON.stringify({
            default_redirect_url: f.get("default_redirect_url"),
            redirect_android_url: f.get("redirect_android_url"),
            redirect_ios_url: f.get("redirect_ios_url"),
          }),
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
        }).then(() => window.location.reload());
      }}
    >
      <div className="text-lg font-semibold">{act.name}</div>
      <Field name="default_redirect_url" label="Main Redirect URL" defaultValue={act.default_redirect_url || ""} />
      <Field name="redirect_android_url" label="Android Redirect URL" defaultValue={act.redirect_android_url || ""} />
      <Field name="redirect_ios_url" label="iOS Redirect URL" defaultValue={act.redirect_ios_url || ""} />
      <div className="pt-1">
        <button className="btn-press rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-900" type="submit">
          Save
        </button>
      </div>
    </form>
  );
}

function Field({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string }) {
  return (
    <label className="block">
      <span className="text-xs text-gray-600">{label}</span>
      <input name={name} defaultValue={defaultValue} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
    </label>
  );
}
