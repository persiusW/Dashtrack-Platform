
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { useState, useEffect } from "react";
import { Database } from "@/integrations/supabase/types";

type Activation = Database["public"]["Tables"]["activations"]["Row"];
type ActivationInsert = Omit<Activation, "id" | "created_at" | "updated_at" | "organization_id">;

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
  const [error, setError] = useState&lt;string | null&gt;(null);

  const form = useForm&lt;ActivationFormData&gt;({
    resolver: zodResolver(activationSchema),
    defaultValues: {
      name: activation?.name || "",
      description: activation?.description || "",
      type: activation?.type || "single",
      start_at: activation?.start_at ? new Date(activation.start_at).toISOString().substring(0, 16) : "",
      end_at: activation?.end_at ? new Date(activation.end_at).toISOString().substring(0, 16) : "",
      status: activation?.status || "draft",
      default_landing_url: activation?.default_landing_url || "",
    },
  });

  const { watch, setValue } = form;

  const onSubmit = async (data: ActivationFormData) => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...data,
        description: data.description || undefined,
        start_at: data.start_at ? new Date(data.start_at).toISOString() : undefined,
        end_at: data.end_at ? new Date(data.end_at).toISOString() : undefined,
      };

      if (activation) {
        await activationService.updateActivation(activation.id, payload);
      } else {
        const createData: ActivationInsert = {
          name: payload.name,
          description: payload.description,
          type: payload.type,
          start_at: payload.start_at,
          end_at: payload.end_at,
          status: payload.status,
          default_landing_url: payload.default_landing_url,
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
    &lt;Form {...form}&gt;
      &lt;form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4"&gt;
        {error && &lt;div className="text-red-500"&gt;{error}&lt;/div&gt;}

        &lt;FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            &lt;FormItem&gt;
              &lt;FormLabel&gt;Name *&lt;/FormLabel&gt;
              &lt;FormControl&gt;
                &lt;Input {...field} /&gt;
              &lt;/FormControl&gt;
              &lt;FormMessage /&gt;
            &lt;/FormItem&gt;
          )}
        /&gt;
        
        &lt;FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            &lt;FormItem&gt;
              &lt;FormLabel&gt;Description&lt;/FormLabel&gt;
              &lt;FormControl&gt;
                &lt;Textarea {...field} /&gt;
              &lt;/FormControl&gt;
              &lt;FormMessage /&gt;
            &lt;/FormItem&gt;
          )}
        /&gt;

        &lt;div className="grid grid-cols-1 md:grid-cols-2 gap-4"&gt;
          &lt;FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              &lt;FormItem&gt;
                &lt;FormLabel&gt;Type *&lt;/FormLabel&gt;
                &lt;Select onValueChange={field.onChange} defaultValue={field.value}&gt;
                  &lt;FormControl&gt;
                    &lt;SelectTrigger&gt;
                      &lt;SelectValue /&gt;
                    &lt;/SelectTrigger&gt;
                  &lt;/FormControl&gt;
                  &lt;SelectContent&gt;
                    &lt;SelectItem value="single"&gt;Single&lt;/SelectItem&gt;
                    &lt;SelectItem value="multi"&gt;Multi&lt;/SelectItem&gt;
                  &lt;/SelectContent&gt;
                &lt;/Select&gt;
                &lt;FormMessage /&gt;
              &lt;/FormItem&gt;
            )}
          /&gt;
          &lt;FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              &lt;FormItem&gt;
                &lt;FormLabel&gt;Status *&lt;/FormLabel&gt;
                &lt;Select onValueChange={field.onChange} defaultValue={field.value}&gt;
                  &lt;FormControl&gt;
                    &lt;SelectTrigger&gt;
                      &lt;SelectValue /&gt;
                    &lt;/SelectTrigger&gt;
                  &lt;/FormControl&gt;
                  &lt;SelectContent&gt;
                    &lt;SelectItem value="draft"&gt;Draft&lt;/SelectItem&gt;
                    &lt;SelectItem value="live"&gt;Live&lt;/SelectItem&gt;
                    &lt;SelectItem value="paused"&gt;Paused&lt;/SelectItem&gt;
                    &lt;SelectItem value="ended"&gt;Ended&lt;/SelectItem&gt;
                  &lt;/SelectContent&gt;
                &lt;/Select&gt;
                &lt;FormMessage /&gt;
              &lt;/FormItem&gt;
            )}
          /&gt;
        &lt;/div&gt;

        &lt;div className="grid grid-cols-1 md:grid-cols-2 gap-4"&gt;
          &lt;FormField
            control={form.control}
            name="start_at"
            render={({ field }) => (
              &lt;FormItem&gt;
                &lt;FormLabel&gt;Start Date&lt;/FormLabel&gt;
                &lt;FormControl&gt;
                  &lt;Input type="datetime-local" {...field} /&gt;
                &lt;/FormControl&gt;
                &lt;FormMessage /&gt;
              &lt;/FormItem&gt;
            )}
          /&gt;
          &lt;FormField
            control={form.control}
            name="end_at"
            render={({ field }) => (
              &lt;FormItem&gt;
                &lt;FormLabel&gt;End Date&lt;/FormLabel&gt;
                &lt;FormControl&gt;
                  &lt;Input type="datetime-local" {...field} /&gt;
                &lt;/FormControl&gt;
                &lt;FormMessage /&gt;
              &lt;/FormItem&gt;
            )}
          /&gt;
        &lt;/div&gt;
        
        &lt;FormField
          control={form.control}
          name="default_landing_url"
          render={({ field }) => (
            &lt;FormItem&gt;
              &lt;FormLabel&gt;Default Landing URL *&lt;/FormLabel&gt;
              &lt;FormControl&gt;
                &lt;Input {...field} /&gt;
              &lt;/FormControl&gt;
              &lt;FormMessage /&gt;
            &lt;/FormItem&gt;
          )}
        /&gt;

        &lt;Button type="submit" disabled={loading}&gt;
          {loading ? "Saving..." : "Save Activation"}
        &lt;/Button&gt;
      &lt;/form&gt;
    &lt;/Form&gt;
  );
}
