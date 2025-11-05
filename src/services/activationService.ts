import { supabase } from "@/integrations/supabase/client";

export interface Activation {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  type: "single" | "multi";
  start_at: string | null;
  end_at: string | null;
  status: "draft" | "live" | "paused" | "ended";
  default_landing_url: string;
  created_at: string;
  updated_at: string;
}

export interface ActivationOption {
  id: string;
  name: string;
}

export const activationService = {
  /**
   * Get all activations for the current organization
   */
  async getActivations(): Promise<Activation[]> {
    const { data, error } = await supabase
      .from("activations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Activation[];
  },

  /**
   * Get activation options (id, name) for the current user's org via server API
   */
  async getActivationOptions(): Promise<ActivationOption[]> {
    const res = await fetch("/api/activations/list", { credentials: "same-origin" });
    const j = await res.json().catch(() => null as any);
    if (!res.ok || !j?.ok) return [];
    const items = Array.isArray(j.items) ? j.items : [];
    return items.map((x: any) => ({ id: String(x.id), name: String(x.name || "") }));
  },

  /**
   * Get a single activation by ID
   */
  async getActivation(id: string): Promise<Activation> {
    const { data, error } = await supabase
      .from("activations")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Activation;
  },

  /**
   * Create a new activation
   */
  async createActivation(activation: Omit<Activation, "id" | "created_at" | "updated_at" | "organization_id">): Promise<Activation> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.app_metadata?.organization_id) {
      throw new Error("User organization not found");
    }

    const { data, error } = await supabase
      .from("activations")
      .insert({
        ...activation,
        organization_id: user.app_metadata.organization_id
      })
      .select()
      .single();

    if (error) throw error;
    return data as Activation;
  },

  /**
   * Update an activation
   */
  async updateActivation(id: string, updates: Partial<Omit<Activation, "id" | "created_at" | "updated_at" | "organization_id">>): Promise<Activation> {
    const { data, error } = await supabase
      .from("activations")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Activation;
  },

  /**
   * Delete an activation
   */
  async deleteActivation(id: string): Promise<void> {
    const { error } = await supabase
      .from("activations")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Get live activations
   */
  async getLiveActivations(): Promise<Activation[]> {
    const { data, error } = await supabase
      .from("activations")
      .select("*")
      .eq("status", "live")
      .order("start_at", { ascending: false });

    if (error) throw error;
    return data as Activation[];
  }
};
