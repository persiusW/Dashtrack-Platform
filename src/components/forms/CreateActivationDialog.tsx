
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface CreateActivationDialogProps {
  triggerVariant?: "default" | "secondary" | "outline" | "ghost";
  onCreated?: (activationId: string) => void;
}

export function CreateActivationDialog({ triggerVariant = "default", onCreated }: CreateActivationDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("Campaign A");
  const [defaultRedirectUrl, setDefaultRedirectUrl] = useState("https://example.com");
  const [androidUrl, setAndroidUrl] = useState("https://play.google.com/...");
  const [iosUrl, setIosUrl] = useState("https://apps.apple.com/...");
  const [districtName, setDistrictName] = useState("New York");
  const [zoneNames, setZoneNames] = useState("Manhattan,Brooklyn");

  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!name.trim() || !defaultRedirectUrl.trim()) {
      toast({ title: "Missing fields", description: "Name and Default redirect URL are required.", variant: "destructive" });
      return;
    }

    const payload = {
      name: name.trim(),
      default_redirect_url: defaultRedirectUrl.trim(),
      redirect_android_url: androidUrl.trim() || undefined,
      redirect_ios_url: iosUrl.trim() || undefined,
      districts: [
        {
          name: districtName.trim() || "Main District",
          zones: (zoneNames || "")
            .split(",")
            .map((z) => z.trim())
            .filter(Boolean)
            .map((z) => ({ name: z })),
        },
      ],
    };

    try {
      setSubmitting(true);
      const res = await fetch("/api/activations/create-structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as { ok: boolean; activation_id?: string; error?: string };

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to create activation");
      }

      toast({ title: "Activation created", description: "Your activation was created successfully." });
      setOpen(false);
      onCreated?.(json.activation_id || "");
    } catch (e) {
      toast({ title: "Creation failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant}>Create activation</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create activation</DialogTitle>
          <DialogDescription>Define destination URLs and an initial district with zones.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Campaign name" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="default-url">Default redirect URL</Label>
            <Input id="default-url" value={defaultRedirectUrl} onChange={(e) => setDefaultRedirectUrl(e.target.value)} placeholder="https://example.com" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="android-url">Android URL (optional)</Label>
            <Input id="android-url" value={androidUrl} onChange={(e) => setAndroidUrl(e.target.value)} placeholder="https://play.google.com/..." />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ios-url">iOS URL (optional)</Label>
            <Input id="ios-url" value={iosUrl} onChange={(e) => setIosUrl(e.target.value)} placeholder="https://apps.apple.com/..." />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="district-name">District name</Label>
            <Input id="district-name" value={districtName} onChange={(e) => setDistrictName(e.target.value)} placeholder="New York" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="zones">Zones (comma-separated)</Label>
            <Input id="zones" value={zoneNames} onChange={(e) => setZoneNames(e.target.value)} placeholder="Manhattan,Brooklyn" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
  