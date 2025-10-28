import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { trackedLinkService } from "@/services/trackedLinkService";
import { zoneService } from "@/services/zoneService";
import { agentService } from "@/services/agentService";
import { activationService } from "@/services/activationService";
import type { Database, Tables } from "@/integrations/supabase/types";
import { qrService } from "@/services/qrService";
import { QrCode, Download } from "lucide-react";

type TrackedLink = Database["public"]["Tables"]["tracked_links"]["Row"];
type Zone = Database["public"]["Tables"]["zones"]["Row"];
type Agent = Database["public"]["Tables"]["agents"]["Row"];
type Activation = Database["public"]["Tables"]["activations"]["Row"];

const trackedLinkSchema = z.object({
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  destination_strategy: z.enum(["single", "smart"]).default("smart"),
  single_url: z.string().optional().nullable(),
  ios_url: z.string().optional().nullable(),
  android_url: z.string().optional().nullable(),
  fallback_url: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  zone_id: z.string().optional().nullable(),
  agent_id: z.string().optional().nullable(),
  is_active: z.boolean().default(true).nullable(),
});

// Adjusted form data type to match what the form uses
type TrackedLinkFormData = Omit<Tables<"tracked_links">, "id" | "created_at" | "updated_at" | "organization_id">;

interface TrackedLinkFormProps {
  link?: TrackedLink;
  activationId: string;
  organizationId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TrackedLinkForm({ link, activationId, organizationId, onSuccess, onCancel }: TrackedLinkFormProps) {
  const [loading, setLoading] = useState(false);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activation, setActivation] = useState<Activation | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [generatingQr, setGeneratingQr] = useState(false);

  const form = useForm<TrackedLinkFormData>({
    resolver: zodResolver(trackedLinkSchema),
    defaultValues: {
      ...link,
      slug: link?.slug || "",
      destination_strategy: link?.destination_strategy as "single" | "smart" || "smart",
      single_url: link?.single_url ?? "",
      ios_url: link?.ios_url ?? "",
      android_url: link?.android_url ?? "",
      fallback_url: link?.fallback_url ?? "",
      notes: link?.notes ?? "",
      zone_id: link?.zone_id ?? "",
      agent_id: link?.agent_id ?? "",
      is_active: link?.is_active ?? true,
      activation_id: link?.activation_id || activationId,
    },
  });

  const strategy = form.watch("destination_strategy");
  const currentSlug = form.watch("slug");

  useEffect(() => {
    loadData();
  }, [activationId, organizationId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentSlug && currentSlug.length > 0) {
        checkSlugAvailability(currentSlug);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [currentSlug]);

  const loadData = async () => {
    try {
      const [zonesData, agentsData, activationData] = await Promise.all([
        zoneService.getZonesByActivation(activationId),
        agentService.getAgents(organizationId),
        activationService.getActivation(activationId)
      ]);
      setZones(zonesData);
      setAgents(agentsData);
      setActivation(activationData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const checkSlugAvailability = async (slug: string) => {
    setCheckingSlug(true);
    try {
      const available = await trackedLinkService.checkSlugAvailable(slug, link?.id);
      setSlugAvailable(available);
    } catch (error) {
      console.error("Error checking slug:", error);
      setSlugAvailable(null);
    } finally {
      setCheckingSlug(false);
    }
  };

  const generateSlug = () => {
    const baseName = `link-${Date.now()}`;
    const slug = trackedLinkService.generateSlugSuggestion(baseName);
    form.setValue("slug", slug);
  };

  const onSubmit = async (data: TrackedLinkFormData) => {
    if (slugAvailable === false) {
      alert("Slug is not available. Please choose a different one.");
      return;
    }

    setLoading(true);
    try {
      const linkData: any = {
        ...data,
        activation_id: activationId,
        organization_id: organizationId
      };

      if (strategy === "smart" && activation?.default_landing_url && !data.fallback_url) {
        linkData.fallback_url = activation.default_landing_url;
      }

      let savedLink: TrackedLink;
      if (link) {
        savedLink = await trackedLinkService.updateTrackedLink(link.id, linkData);
      } else {
        savedLink = await trackedLinkService.createTrackedLink(linkData);
      }

      setGeneratingQr(true);
      try {
        await qrService.generateAndUploadQR({
          slug: savedLink.slug,
          trackedLinkId: savedLink.id,
          activationId: savedLink.activation_id,
          zoneId: savedLink.zone_id,
          agentId: savedLink.agent_id
        });

        const signedUrl = await qrService.getQRSignedUrl({
          trackedLinkId: savedLink.id,
          activationId: savedLink.activation_id,
          zoneId: savedLink.zone_id,
          agentId: savedLink.agent_id
        });
        setQrUrl(signedUrl);
      } catch (qrError) {
        console.error("Error generating QR:", qrError);
      } finally {
        setGeneratingQr(false);
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving tracked link:", error);
      alert("Failed to save tracked link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="slug">Slug *</Label>
        <div className="flex gap-2">
          <Input
            id="slug"
            {...form.register("slug")}
            placeholder="my-campaign-link"
            className={slugAvailable === false ? "border-red-500" : slugAvailable === true ? "border-green-500" : ""}
          />
          <Button type="button" variant="outline" onClick={generateSlug}>
            Generate
          </Button>
        </div>
        {checkingSlug && <p className="text-sm text-muted-foreground mt-1">Checking availability...</p>}
        {slugAvailable === false && <p className="text-sm text-red-500 mt-1">Slug is already taken</p>}
        {slugAvailable === true && <p className="text-sm text-green-500 mt-1">Slug is available</p>}
        {form.formState.errors.slug && <p className="text-sm text-red-500 mt-1">{form.formState.errors.slug.message}</p>}
      </div>

      <div>
        <Label htmlFor="destination_strategy">Destination Strategy *</Label>
        <Select
          value={strategy}
          onValueChange={(value) => form.setValue("destination_strategy", value as "single" | "smart")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="smart">Smart (Device Detection)</SelectItem>
            <SelectItem value="single">Single URL</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {strategy === "single" ? (
        <div>
          <Label htmlFor="single_url">Single URL *</Label>
          <Input id="single_url" {...form.register("single_url")} placeholder="https://example.com" />
          {form.formState.errors.single_url && <p className="text-sm text-red-500 mt-1">{form.formState.errors.single_url.message}</p>}
        </div>
      ) : (
        <>
          <div>
            <Label htmlFor="ios_url">iOS URL</Label>
            <Input id="ios_url" {...form.register("ios_url")} placeholder="https://apps.apple.com/..." />
          </div>

          <div>
            <Label htmlFor="android_url">Android URL</Label>
            <Input id="android_url" {...form.register("android_url")} placeholder="https://play.google.com/..." />
          </div>

          <div>
            <Label htmlFor="fallback_url">Fallback URL</Label>
            <Input
              id="fallback_url"
              {...form.register("fallback_url")}
              placeholder={activation?.default_landing_url || "https://example.com"}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Defaults to activation&apos;s landing URL if not set
            </p>
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="zone_id">Zone (Optional)</Label>
          <Select
            value={form.watch("zone_id") ?? ""}
            onValueChange={(value) => form.setValue("zone_id", value || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {zones.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>
                  {zone.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="agent_id">Agent (Optional)</Label>
          <Select
            value={form.watch("agent_id") ?? ""}
            onValueChange={(value) => form.setValue("agent_id", value || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...form.register("notes")} placeholder="Internal notes..." rows={3} />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="is_active">Active</Label>
        <Switch
          id="is_active"
          checked={form.watch("is_active") ?? true}
          onCheckedChange={(checked) => form.setValue("is_active", checked)}
        />
      </div>

      {qrUrl && (
        <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <QrCode className="h-5 w-5 text-green-600 mr-2" />
              <h4 className="font-semibold text-green-800 dark:text-green-200">QR Code Generated!</h4>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open(qrUrl, "_blank")}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
          <div className="flex justify-center">
            <img src={qrUrl} alt="QR Code" className="w-48 h-48 border-2 border-green-200 rounded" />
          </div>
        </div>
      )}

      {generatingQr && (
        <div className="text-center text-sm text-muted-foreground">
          Generating QR code...
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || slugAvailable === false}>
          {loading ? "Saving..." : link ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
