
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { activationService } from "@/services/activationService";
import { useState } from "react";
import { Database } from "@/integrations/supabase/types";

type Activation = Database["public"]["Tables"]["activations"]["Row"];
type ActivationInsert = Omit<Activation, "id" | "created_at" | "updated_at" | "organization_id">;
type ActivationStatus = "draft" | "live" | "paused" | "ended";
type ActivationType = "single" | "multi";

const activationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.enum(["single", "multi"]),
  start_at: z.string().optional(),
  end_at: z.string().optional(),
  status: z.enum(["draft", "live", "paused", "ended"]),
  default_landing_url: z.string().url("Must be a valid URL"),
});

type ActivationFormData = z.infer<typeof activationSchema>;

interface ActivationFormProps {
  activation?: Activation | null;
  onSuccess: () => void;
}

export function ActivationForm({ activation, onSuccess }: ActivationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ActivationFormData>({
    resolver: zodResolver(activationSchema),
    defaultValues: {
      name: activation?.name || "",
      description: activation?.description || "",
      type: (activation?.type as ActivationType) || "single",
      start_at: activation?.start_at ? new Date(activation.start_at).toISOString().substring(0, 16) : "",
      end_at: activation?.end_at ? new Date(activation.end_at).toISOString().substring(0, 16) : "",
      status: (activation?.status as ActivationStatus) || "draft",
      default_landing_url: activation?.default_landing_url || "",
    },
  });

  const onSubmit = async (data: ActivationFormData) => {
    setLoading(true);
    setError(null);
    try {
      const payload: Omit<Activation, "id" | "created_at" | "updated_at" | "organization_id"> & { start_at?: string, end_at?: string } = {
        ...data,
        description: data.description || null,
        start_at: data.start_at ? new Date(data.start_at).toISOString() : null,
        end_at: data.end_at ? new Date(data.end_at).toISOString() : null,
      };

      if (activation) {
        await activationService.updateActivation(activation.id, payload);
      } else {
        const createData: ActivationInsert = {
            ...payload
        };
        await activationService.createActivation(createData);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && <div className="text-red-500">{error}</div>}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="multi">Multi</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="ended">Ended</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="end_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="default_landing_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Landing URL *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Activation"}
        </Button>
      </form>
    </Form>
  );
}
