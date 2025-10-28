
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
import type { Database } from "@/integrations/supabase/types";

type TrackedLink = Database["public"]["Tables"]["tracked_links"]["Row"];
type Zone = Database["public"]["Tables"]["zones"]["Row"];
type Agent = Database["public"]["Tables"]["agents"]["Row"];
type Activation = Database["public"]["Tables"]["activations"]["Row"];

const trackedLinkSchema = z.object({
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  destination_strategy: z.enum(["single", "smart"]).default("smart"),
  single_url: z.string().optional(),
  ios_url: z.string().optional(),
  android_url: z.string().optional(),
  fallback_url: z.string().optional(),
  notes: z.string().optional(),
  zone_id: z.string().optional(),
  agent_id: z.string().optional(),
  is_active: z.boolean().default(true)
});

type TrackedLinkFormData = z.infer<typeof trackedLinkSchema>;

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

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<TrackedLinkFormData>({
    resolver: zodResolver(trackedLinkSchema),
    defaultValues: link ? {
      slug: link.slug,
      destination_strategy: link.destination_strategy as "single" | "smart",
      single_url: link.single_url || "",
      ios_url: link.ios_url || "",
      android_url: link.android_url || "",
      fallback_url: link.fallback_url || "",
      notes: link.notes || "",
      zone_id: link.zone_id || "",
      agent_id: link.agent_id || "",
      is_active: link.is_active
    } : {
      destination_strategy: "smart",
      is_active: true
    }
  });

  const strategy = watch("destination_strategy");
  const currentSlug = watch("slug");

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
    setValue("slug", slug);
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

      if (link) {
        await trackedLinkService.updateTrackedLink(link.id, linkData);
      } else {
        await trackedLinkService.createTrackedLink(linkData);
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="slug">Slug *</Label>
        <div className="flex gap-2">
          <Input
            id="slug"
            {...register("slug")}
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
        {errors.slug && <p className="text-sm text-red-500 mt-1">{errors.slug.message}</p>}
      </div>

      <div>
        <Label htmlFor="destination_strategy">Destination Strategy *</Label>
        <Select
          value={strategy}
          onValueChange={(value) => setValue("destination_strategy", value as "single" | "smart")}
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
          <Input id="single_url" {...register("single_url")} placeholder="https://example.com" />
          {errors.single_url && <p className="text-sm text-red-500 mt-1">{errors.single_url.message}</p>}
        </div>
      ) : (
        <>
          <div>
            <Label htmlFor="ios_url">iOS URL</Label>
            <Input id="ios_url" {...register("ios_url")} placeholder="https://apps.apple.com/..." />
          </div>

          <div>
            <Label htmlFor="android_url">Android URL</Label>
            <Input id="android_url" {...register("android_url")} placeholder="https://play.google.com/..." />
          </div>

          <div>
            <Label htmlFor="fallback_url">Fallback URL</Label>
            <Input
              id="fallback_url"
              {...register("fallback_url")}
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
            value={watch("zone_id") || ""}
            onValueChange={(value) => setValue("zone_id", value || undefined)}
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
            value={watch("agent_id") || ""}
            onValueChange={(value) => setValue("agent_id", value || undefined)}
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
        <Textarea id="notes" {...register("notes")} placeholder="Internal notes..." rows={3} />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="is_active">Active</Label>
        <Switch
          id="is_active"
          checked={watch("is_active")}
          onCheckedChange={(checked) => setValue("is_active", checked)}
        />
      </div>

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
