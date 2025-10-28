import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zoneService } from "@/services/zoneService";
import { trackedLinkService } from "@/services/trackedLinkService";
import type { Database } from "@/integrations/supabase/types";

type Zone = Database["public"]["Tables"]["zones"]["Row"];
type TrackedLink = Database["public"]["Tables"]["tracked_links"]["Row"];

const zoneSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  zone_stand_link_id: z.string().optional()
});

type ZoneFormData = z.infer<typeof zoneSchema>;

interface ZoneFormProps {
  zone?: Zone;
  activationId: string;
  organizationId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ZoneForm({ zone, activationId, organizationId, onSuccess, onCancel }: ZoneFormProps) {
  const [loading, setLoading] = useState(false);
  const [availableLinks, setAvailableLinks] = useState<TrackedLink[]>([]);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ZoneFormData>({
    resolver: zodResolver(zoneSchema),
    defaultValues: zone ? {
      name: zone.name,
      address: zone.address || "",
      lat: zone.lat || undefined,
      lng: zone.lng || undefined,
      zone_stand_link_id: zone.zone_stand_link_id || ""
    } : {}
  });

  useEffect(() => {
    loadAvailableLinks();
  }, [activationId]);

  const loadAvailableLinks = async () => {
    try {
      const links = await trackedLinkService.getTrackedLinks(organizationId, activationId);
      setAvailableLinks(links);
    } catch (error) {
      console.error("Error loading links:", error);
    }
  };

  const onSubmit = async (data: ZoneFormData) => {
    setLoading(true);
    try {
      if (zone) {
        const updateData = {
          ...data,
          lat: data.lat ?? null,
          lng: data.lng ?? null,
          address: data.address || null,
          zone_stand_link_id: data.zone_stand_link_id || null
        };
        await zoneService.updateZone(zone.id, updateData);
      } else {
        const createData: Omit<Zone, "id" | "created_at" | "updated_at" | "organization_id"> = {
          activation_id: activationId,
          name: data.name,
          address: data.address || null,
          lat: data.lat ?? null,
          lng: data.lng ?? null,
          zone_stand_link_id: data.zone_stand_link_id || null,
        };
        await zoneService.createZone(createData);
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving zone:", error);
      alert("Failed to save zone");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Zone Name *</Label>
        <Input id="name" {...register("name")} placeholder="Zone A" />
        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Input id="address" {...register("address")} placeholder="123 Main St, City, State" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="lat">Latitude</Label>
          <Input
            id="lat"
            type="number"
            step="any"
            {...register("lat", { valueAsNumber: true })}
            placeholder="40.7128"
          />
        </div>

        <div>
          <Label htmlFor="lng">Longitude</Label>
          <Input
            id="lng"
            type="number"
            step="any"
            {...register("lng", { valueAsNumber: true })}
            placeholder="-74.0060"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="zone_stand_link_id">Zone Stand Link</Label>
        <Select
          value={watch("zone_stand_link_id") || ""}
          onValueChange={(value) => setValue("zone_stand_link_id", value || undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a tracked link (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {availableLinks.map((link) => (
              <SelectItem key={link.id} value={link.id}>
                {link.slug}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : zone ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
