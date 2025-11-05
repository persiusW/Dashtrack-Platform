import { useState, useCallback } from "react";
import type { GetServerSideProps } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import { AppLayout } from "@/components/layouts/AppLayout";
import QuickCreateDialog from "@/components/QuickCreateDialog";
import { RowActions } from "@/components/RowActions";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { RenameDialog } from "@/components/RenameDialog";
import { useToast } from "@/hooks/use-toast";

type Agent = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  active: boolean | null;
  public_stats_token: string;
  created_at: string | null;
};

type AgentsProps = {
  organizationId: string | null;
  activationCount: number;
  agents: Agent[];
};

export const getServerSideProps: GetServerSideProps<AgentsProps> = async (ctx) => {
  const supabase = createPagesServerClient(ctx);

  const { data: sessionRes } = await supabase.auth.getSession();
  if (!sessionRes?.session) {
    return { redirect: { destination: "/login?next=/app/agents", permanent: false } };
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
  let agents: Agent[] = [];

  if (organizationId) {
    const { count } = await supabase
      .from("activations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId);
    activationCount = count ?? 0;

    if (activationCount > 0) {
      const { data } = await supabase
        .from("agents")
        .select("id, name, email, phone, active, public_stats_token, created_at")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });
      agents = (data as Agent[]) || [];
    }
  }

  return {
    props: { organizationId, activationCount, agents },
  };
};

export default function AgentsPage({ organizationId, activationCount, agents }: AgentsProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<Agent[]>(agents || []);
  const [renaming, setRenaming] = useState<Pick<Agent, "id" | "name"> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Pick<Agent, "id" | "name"> | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleStartRename = useCallback((id: string, name: string) => {
    setRenaming({ id, name });
  }, []);

  const handleSaveRename = useCallback(
    async (newName: string) => {
      if (!renaming) return;
      const id = renaming.id;
      try {
        setBusyId(id);
        const res = await fetch(`/api/agents/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || !j?.ok) throw new Error(j?.error || "Update failed");
        setItems((prev) => prev.map((a) => (a.id === id ? { ...a, name: newName } : a)));
        setRenaming(null);
        toast({ title: "Renamed", description: "Agent name updated." });
      } catch (e: any) {
        toast({ title: "Rename failed", description: e?.message || "Unable to rename agent.", variant: "destructive" as any });
      } finally {
        setBusyId(null);
      }
    },
    [renaming, toast]
  );

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    try {
      setBusyId(id);
      const res = await fetch(`/api/agents/${id}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error || "Delete failed");
      setItems((prev) => prev.filter((a) => a.id !== id));
      setConfirmDelete(null);
      toast({ title: "Deleted", description: "Agent removed." });
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message || "Unable to delete agent.", variant: "destructive" as any });
    } finally {
      setBusyId(null);
    }
  }, [confirmDelete, toast]);

  if (!organizationId || activationCount === 0) {
    return (
      <AppLayout>
        <NoActivationsMessage />
      </AppLayout>
    );
  }

  if (!items || items.length === 0) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto text-center mt-16">
          <h2 className="text-2xl font-semibold">No agents yet</h2>
          <p className="mt-2 text-gray-600">Create an activation to add agents and start tracking.</p>
          <NoActivationsMessageInner />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Agents</h1>
        </div>
        <div className="grid gap-3">
          {items.map((a) => {
            const ts = a.created_at ? new Date(a.created_at as unknown as string).toISOString().replace("T", " ").slice(0, 16) : "";
            const disabled = busyId === a.id;
            return (
              <div key={a.id} className="rounded-xl border p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{a.name}</div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-600">{ts}</div>
                    <RowActions
                      onRename={() => handleStartRename(a.id, a.name)}
                      onDelete={() => setConfirmDelete({ id: a.id, name: a.name })}
                      size="sm"
                      disabled={disabled}
                    />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {a.email ? <span className="mr-4">Email: {a.email}</span> : null}
                  {a.phone ? <span>Phone: {a.phone}</span> : null}
                </div>
                <div className="mt-2 text-sm">
                  <Link className="underline" href={`/a/${a.public_stats_token}`} target="_blank">
                    View Public Stats
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <RenameDialog
        open={!!renaming}
        title="Rename Agent"
        initial={renaming?.name || ""}
        label="Agent name"
        onSave={handleSaveRename}
        onCancel={() => setRenaming(null)}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete agent?"
        message={confirmDelete ? `This will permanently delete "${confirmDelete.name}".` : undefined}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
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
      <p className="mt-2 text-gray-600">Create an activation to add agents.</p>
      <NoActivationsMessageInner />
    </div>
  );
}
