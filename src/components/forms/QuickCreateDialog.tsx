
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface QuickCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (activationId: string) => void;
}

export function QuickCreateDialog({ open, onOpenChange, onCreated }: QuickCreateDialogProps) {
  const [name, setName] = useState("");
  const [zones, setZones] = useState<number>(1);
  const [agentsPerZone, setAgentsPerZone] = useState<number>(1);
  const [redirectUrl, setRedirectUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/activations/quick-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name,
          zones,
          agentsPerZone,
          redirect_url: redirectUrl,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to create activation");
      }

      onOpenChange(false);
      if (data?.activation_id) {
        onCreated?.(data.activation_id);
      } else {
        // fallback: just reload overview
        window.location.assign("/app/overview");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to create activation");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Create Activation</DialogTitle>
          <DialogDescription>Spin up an activation with zones, agents, and links.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="space-y-2">
            <Label htmlFor="qc-name">Activation name</Label>
            <Input
              id="qc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fall Launch"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qc-zones">Zones</Label>
              <Input
                id="qc-zones"
                type="number"
                min={1}
                max={5}
                value={zones}
                onChange={(e) => setZones(Math.max(1, Math.min(5, Number(e.target.value) || 1)))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qc-agents">Agents per zone</Label>
              <Input
                id="qc-agents"
                type="number"
                min={1}
                max={50}
                value={agentsPerZone}
                onChange={(e) => setAgentsPerZone(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="qc-url">Default redirect URL</Label>
            <Input
              id="qc-url"
              type="url"
              value={redirectUrl}
              onChange={(e) => setRedirectUrl(e.target.value)}
              placeholder="https://example.com"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default QuickCreateDialog;
  