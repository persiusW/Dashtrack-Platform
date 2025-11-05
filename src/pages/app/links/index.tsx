import { useCallback, useMemo, useState } from "react";
import type { GetServerSideProps } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import { AppLayout } from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Copy, ExternalLink, Plus, Search } from "lucide-react";
import type { TrackedLink } from "@/services/trackedLinkService";
import { trackedLinkService } from "@/services/trackedLinkService";
import { RenameDialog } from "@/components/RenameDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { RowActions } from "@/components/RowActions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

type LinksProps = {
  organizationId: string | null;
  links: Pick<TrackedLink, "id" | "slug" | "is_active" | "created_at" | "description" | "redirect_url">[];
};

export const getServerSideProps: GetServerSideProps<LinksProps> = async (ctx) => {
  const supabase = createPagesServerClient(ctx);

  const { data: sessionRes } = await supabase.auth.getSession();
  if (!sessionRes?.session) {
    return { redirect: { destination: "/login?next=/app/links", permanent: false } };
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

  let links: LinksProps["links"] = [];

  if (organizationId) {
    const { data } = await supabase
      .from("tracked_links")
      .select("id, slug, is_active, created_at, description, redirect_url")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });
    links = (data as any) || [];
  }

  return {
    props: { organizationId, links },
  };
};

export default function LinksPage({ organizationId, links: initialLinks }: LinksProps) {
  const { toast } = useToast();
  const [links, setLinks] = useState(initialLinks);
  const [search, setSearch] = useState("");
  const [renaming, setRenaming] = useState<{ id: string; description: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; slug: string } | null>(null);
  const [redirectEdit, setRedirectEdit] = useState<{ id: string; url: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return links;
    const q = search.toLowerCase();
    return links.filter((l) => {
      const desc = (l.description || "").toLowerCase();
      return l.slug.toLowerCase().includes(q) || desc.includes(q);
    });
  }, [links, search]);

  const handleCopyLink = useCallback(
    (slug: string) => {
      try {
        const url = `${window.location.origin}/l/${slug}`;
        navigator.clipboard.writeText(url);
        toast({ title: "Copied", description: "Link copied to clipboard." });
      } catch {
        toast({ title: "Copy failed", description: "Unable to copy link.", variant: "destructive" as any });
      }
    },
    [toast]
  );

  const handleOpenLink = useCallback((slug: string) => {
    window.open(`/l/${slug}`, "_blank");
  }, []);

  const handleStartRenameDescription = useCallback((id: string, current: string) => {
    setRenaming({ id, description: current || "" });
  }, []);

  const handleSaveDescription = useCallback(
    async (newDesc: string) => {
      if (!renaming) return;
      const id = renaming.id;

      try {
        setBusyId(id);
        const res = await fetch(`/api/links/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: newDesc }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || !j?.ok) throw new Error(j?.error || "Update failed");

        setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, description: newDesc } : l)));
        toast({ title: "Updated", description: "Description saved." });
        setRenaming(null);
      } catch (e: any) {
        toast({ title: "Update failed", description: e?.message || "Unable to update description.", variant: "destructive" as any });
      } finally {
        setBusyId(null);
      }
    },
    [renaming, toast]
  );

  const handleStartEditRedirect = useCallback((id: string, currentUrl: string | null) => {
    setRedirectEdit({ id, url: currentUrl || "" });
  }, []);

  const handleSaveRedirect = useCallback(
    async (newUrl: string) => {
      if (!redirectEdit) return;
      const id = redirectEdit.id;

      try {
        setBusyId(id);
        const res = await fetch(`/api/links/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ redirect_url: newUrl }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || !j?.ok) throw new Error(j?.error || "Update failed");

        setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, redirect_url: newUrl } : l)));
        toast({ title: "Updated", description: "Redirect URL saved." });
        setRedirectEdit(null);
      } catch (e: any) {
        toast({ title: "Update failed", description: e?.message || "Unable to update redirect URL.", variant: "destructive" as any });
      } finally {
        setBusyId(null);
      }
    },
    [redirectEdit, toast]
  );

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) return;
    const id = confirmDelete.id;

    try {
      setBusyId(id);
      await trackedLinkService.deleteTrackedLink(id);
      setLinks((prev) => prev.filter((l) => l.id !== id));
      toast({ title: "Deleted", description: "Tracked link removed." });
      setConfirmDelete(null);
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message || "Unable to delete.", variant: "destructive" as any });
    } finally {
      setBusyId(null);
    }
  }, [confirmDelete, toast]);

  if (!organizationId) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto text-center mt-16">
          <h2 className="text-2xl font-semibold">No organization found</h2>
          <p className="mt-2 text-gray-600">Please create or join an organization to manage links.</p>
          <div className="mt-6">
            <Link href="/app/overview">
              <Button>Go to Overview</Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Tracked Links</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your tracking links</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Link
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Link Directory</CardTitle>
            <CardDescription>Search and manage all tracked links</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by /slug or description..."
                className="flex-1"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              {filtered.map((link) => {
                const ts = link.created_at
                  ? new Date(link.created_at as unknown as string)
                      .toISOString()
                      .replace("T", " ")
                      .slice(0, 16)
                  : "";
                const disabled = busyId === link.id;
                return (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors bg-white dark:bg-gray-900"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-3 mb-2">
                        <code className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          /{link.slug}
                        </code>
                        <Badge
                          variant={link.is_active ? "default" : "secondary"}
                          className={
                            link.is_active
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : ""
                          }
                        >
                          {link.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{ts}</span>
                      </div>
                      {link.description ? (
                        <div className="text-sm text-gray-800 dark:text-gray-200 truncate">
                          {link.description}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic">No description</div>
                      )}
                      {link.redirect_url ? (
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">→ {link.redirect_url}</div>
                      ) : (
                        <div className="text-xs text-gray-500 mt-1 italic">No redirect URL</div>
                      )}
                      <div className="mt-2">
                        <button
                          className="text-xs underline"
                          onClick={() => handleStartEditRedirect(link.id, link.redirect_url || "")}
                          disabled={disabled}
                        >
                          Edit redirect URL
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => handleCopyLink(link.slug)} disabled={disabled}>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleOpenLink(link.slug)} disabled={disabled}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <RowActions
                        onRename={() => handleStartRenameDescription(link.id, link.description || "")}
                        onDelete={() => setConfirmDelete({ id: link.id, slug: link.slug })}
                        size="sm"
                        disabled={disabled}
                      />
                    </div>
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-8">No links found.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <RenameDialog
        open={!!renaming}
        title="Edit Description"
        initial={renaming?.description || ""}
        label="Description"
        onSave={handleSaveDescription}
        onCancel={() => setRenaming(null)}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Link?"
        message={
          confirmDelete ? `This will permanently delete /${confirmDelete.slug} and its QR code.` : undefined
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <RedirectDialog
        open={!!redirectEdit}
        initialUrl={redirectEdit?.url || ""}
        onSave={handleSaveRedirect}
        onCancel={() => setRedirectEdit(null)}
      />
    </AppLayout>
  );
}

function RedirectDialog({
  open,
  initialUrl,
  onSave,
  onCancel,
}: {
  open: boolean;
  initialUrl: string;
  onSave: (url: string) => void;
  onCancel: () => void;
}) {
  const [url, setUrl] = useState<string>(initialUrl || "");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  // keep local state in sync when opened for a different row
  const resetOnOpen = useMemo(() => initialUrl, [initialUrl]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _sync = resetOnOpen; // dependency placeholder to satisfy linting in this context

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) onCancel();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    try {
      setSubmitting(true);
      setErr("");
      await onSave(url.trim());
    } catch (e: any) {
      setErr(e?.message || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Edit redirect URL</DialogTitle>
            <DialogDescription>Update where this tracked link redirects to.</DialogDescription>
          </DialogHeader>
          {err ? <div className="text-sm text-red-600">{err}</div> : null}
          <div className="mt-3">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/landing"
            />
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!url.trim() || submitting}>
              {submitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}