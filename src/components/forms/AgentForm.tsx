
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { agentService } from "@/services/agentService";
import type { Database } from "@/integrations/supabase/types";

type Agent = Database["public"]["Tables"]["agents"]["Row"];

const agentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  active: z.boolean().default(true)
});

type AgentFormData = z.infer<typeof agentSchema>;

interface AgentFormProps {
  agent?: Agent;
  organizationId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AgentForm({ agent, organizationId, onSuccess, onCancel }: AgentFormProps) {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: agent ? {
      name: agent.name,
      phone: agent.phone || "",
      email: agent.email || "",
      active: agent.active
    } : {
      active: true
    }
  });

  const onSubmit = async (data: AgentFormData) => {
    setLoading(true);
    try {
      if (agent) {
        await agentService.updateAgent(agent.id, data);
      } else {
        const createData = {
          ...data,
          active: data.active ?? true,
          phone: data.phone || null,
          email: data.email || null,
        };
        await agentService.createAgent(createData);
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving agent:", error);
      alert("Failed to save agent");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Agent Name *</Label>
        <Input id="name" {...register("name")} placeholder="John Doe" />
        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" {...register("phone")} placeholder="+1 234 567 8900" />
        {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register("email")} placeholder="agent@example.com" />
        {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="active">Active</Label>
        <Switch
          id="active"
          checked={watch("active")}
          onCheckedChange={(checked) => setValue("active", checked)}
        />
      </div>

      {agent && (
        <div className="bg-muted p-3 rounded-md">
          <p className="text-sm text-muted-foreground mb-1">Public Stats Token</p>
          <code className="text-xs bg-background px-2 py-1 rounded">{agent.public_stats_token}</code>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : agent ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
