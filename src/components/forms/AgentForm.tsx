
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { agentService } from "@/services/agentService";
import { useState, useEffect } from "react";
import { Database } from "@/integrations/supabase/types";

type Agent = Database["public"]["Tables"]["agents"]["Row"];

const agentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  active: z.boolean().default(true),
});

type AgentFormData = z.infer<typeof agentSchema>;

interface AgentFormProps {
  agent?: Agent | null;
  onSuccess: () => void;
}

export function AgentForm({ agent, onSuccess }: AgentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState&lt;string | null&gt;(null);

  const form = useForm&lt;AgentFormData&gt;({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: agent?.name || "",
      phone: agent?.phone || "",
      email: agent?.email || "",
      active: agent?.active ?? true,
    },
  });

  const onSubmit = async (data: AgentFormData) => {
    setLoading(true);
    setError(null);
    try {
      if (agent) {
        await agentService.updateAgent(agent.id, data);
      } else {
        await agentService.createAgent(data);
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
          name="phone"
          render={({ field }) => (
            &lt;FormItem&gt;
              &lt;FormLabel&gt;Phone&lt;/FormLabel&gt;
              &lt;FormControl&gt;
                &lt;Input {...field} /&gt;
              &lt;/FormControl&gt;
              &lt;FormMessage /&gt;
            &lt;/FormItem&gt;
          )}
        /&gt;

        &lt;FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            &lt;FormItem&gt;
              &lt;FormLabel&gt;Email&lt;/FormLabel&gt;
              &lt;FormControl&gt;
                &lt;Input {...field} /&gt;
              &lt;/FormControl&gt;
              &lt;FormMessage /&gt;
            &lt;/FormItem&gt;
          )}
        /&gt;
        
        &lt;FormField
            control={form.control}
            name="active"
            render={({ field }) => (
                &lt;FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"&gt;
                    &lt;div className="space-y-0.5"&gt;
                        &lt;FormLabel&gt;Active&lt;/FormLabel&gt;
                    &lt;/div&gt;
                    &lt;FormControl&gt;
                        &lt;Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        /&gt;
                    &lt;/FormControl&gt;
                &lt;/FormItem&gt;
            )}
        /&gt;

        &lt;Button type="submit" disabled={loading}&gt;
          {loading ? "Saving..." : "Save Agent"}
        &lt;/Button&gt;
      &lt;/form&gt;
    &lt;/Form&gt;
  );
}
