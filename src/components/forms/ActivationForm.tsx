
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { activationService } from "@/services/activationService";
import type { Database } from "@/integrations/supabase/types";

type Activation = Database["public"]["Tables"]["activations"]["Row"];

const activationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.enum(["single", "multi"]).default("single"),
  start_at: z.string().optional(),
  end_at: z.string().optional(),
  status: z.enum(["draft", "live", "paused", "ended"]).default("draft"),
  default_landing_url: z.string().url("Must be a valid URL")
});

type ActivationFormData = z.infer<typeof activationSchema>;

interface ActivationFormProps {
  activation?: Activation;
  organizationId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ActivationForm({ activation, organizationId, onSuccess, onCancel }: ActivationFormProps) {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ActivationFormData>({
    resolver: zodResolver(activationSchema),
    defaultValues: activation ? {
      name: activation.name,
      description: activation.description || "",
      type: activation.type as "single" | "multi",
      start_at: activation.start_at ? new Date(activation.start_at).toISOString().slice(0, 16) : "",
      end_at: activation.end_at ? new Date(activation.end_at).toISOString().slice(0, 16) : "",
      status: activation.status as "draft" | "live" | "paused" | "ended",
      default_landing_url: activation.default_landing_url
    } : {
      type: "single",
      status: "draft",
      default_landing_url: ""
    }
  });

  const onSubmit = async (data: ActivationFormData) => {
    setLoading(true);
    try {
      if (activation) {
        await activationService.updateActivation(activation.id, data);
      } else {
        const createData: Omit<Activation, "id" | "created_at" | "updated_at" | "organization_id"> = {
          ...data,
          type: data.type || "single",
          status: data.status || "draft",
          start_at: data.start_at || null,
          end_at: data.end_at || null,
          description: data.description || null,
        };
        await activationService.createActivation(createData);
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving activation:", error);
      alert("Failed to save activation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Name *</Label>
        <Input id="name" {...register("name")} placeholder="Campaign Name" />
        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register("description")} placeholder="Campaign description..." rows={3} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Type *</Label>
          <Select defaultValue={watch("type")} onValueChange={(value) => setValue("type", value as "single" | "multi")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="multi">Multi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status">Status *</Label>
          <Select defaultValue={watch("status")} onValueChange={(value) => setValue("status", value as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="ended">Ended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_at">Start Date</Label>
          <Input id="start_at" type="datetime-local" {...register("start_at")} />
        </div>

        <div>
          <Label htmlFor="end_at">End Date</Label>
          <Input id="end_at" type="datetime-local" {...register("end_at")} />
        </div>
      </div>

      <div>
        <Label htmlFor="default_landing_url">Default Landing URL *</Label>
        <Input id="default_landing_url" {...register("default_landing_url")} placeholder="https://example.com" />
        {errors.default_landing_url && <p className="text-sm text-red-500 mt-1">{errors.default_landing_url.message}</p>}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : activation ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
