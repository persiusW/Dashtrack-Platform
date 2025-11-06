import { useCallback, useState } from "react";
import type { GetServerSideProps } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import { AppLayout } from "@/components/layouts/AppLayout";
import GuidedCreateDialog from "@/components/GuidedCreateDialog";
import { RowActions } from "@/components/RowActions";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { RenameDialog } from "@/components/RenameDialog";
import { useToast } from "@/hooks/use-toast";
import EmptyState from "@/components/ui/EmptyState";
import { CreateActivationDialog } from "@/components/forms/CreateActivationDialog";

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
  const { toast } = useToast();
  const [items, setItems] = useState<Activation[]>(activations || []);
  const [renaming, setRenaming] = useState<Pick<Activation, "id" | "name"> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Pick<Activation, "id" | "name"> | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const handleStartRename = useCallback((id: string, name: string) => {
    setRenaming({ id, name });
  }, []);

  const handleSaveRename = useCallback(
    async (newName: string) => {
      if (!renaming) return;
      const id = renaming.id;

      try {
        setBusyId(id);
        const res = await fetch(`/api/activations/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || !j?.ok) {
          throw new Error(j?.error || "Update failed");
        }

        setItems((prev) => prev.map((a) => (a.id === id ? { ...a, name: newName } : a)));
        setRenaming(null);
        toast({ title: "Renamed", description: "Activation name updated." });
      } catch (e: any) {
        toast({
          title: "Rename failed",
          description: e?.message || "Unable to rename activation.",
          variant: "destructive" as any,
        });
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
      const res = await fetch(`/api/activations/${id}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) {
        throw new Error(j?.error || "Delete failed");
      }

      setItems((prev) => prev.filter((a) => a.id !== id));
      setConfirmDelete(null);
      toast({ title: "Deleted", description: "Activation removed." });
    } catch (e: any) {
      toast({
        title: "Delete failed",
        description: e?.message || "Unable to delete activation.",
        variant: "destructive" as any,
      });
    } finally {
      setBusyId(null);
    }
  }, [confirmDelete, toast]);

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

  if (!items || items.length === 0) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto mt-16">
          <EmptyState
            title="No activations yet"
            desc="Create your first activation to start adding districts, zones and agents."
            actions={[{ label: "Create activation", primary: true, onClick: () => setCreateOpen(true) }]}
          />
          <div className="mt-6 flex justify-center">
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
        </div>
        <GuidedCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Activations</h1>
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
        <div className="space-y-3">
          {items.map((a) => {
            const ts = a.created_at
              ? new Date(a.created_at as unknown as string).toISOString().replace("T", " ").slice(0, 16)
              : "";
            const disabled = busyId === a.id;
            return (
              <div
                key={a.id}
                className="flex items-center justify-between p-4 rounded-xl border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors bg-white dark:bg-gray-900"
              >
                <div className="min-w-0">
                  <div className="flex items-center space-x-3">
                    <Link href={`/app/activations/${a.id}`} className="font-medium truncate">
                      {a.name}
                    </Link>
                    <span className="text-xs text-muted-foreground">{ts}</span>
                  </div>
                </div>
                <div className="ml-4">
                  <RowActions
                    onRename={() => handleStartRename(a.id, a.name)}
                    onDelete={() => setConfirmDelete({ id: a.id, name: a.name })}
                    size="sm"
                    disabled={disabled}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <RenameDialog
        open={!!renaming}
        title="Rename Activation"
        initial={renaming?.name || ""}
        label="Activation name"
        onSave={handleSaveRename}
        onCancel={() => setRenaming(null)}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete activation?"
        message={confirmDelete ? `This will permanently delete "${confirmDelete.name}".` : undefined}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
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
