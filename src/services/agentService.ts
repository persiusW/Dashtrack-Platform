
import { supabase } from "@/integrations/supabase/client";

export interface Agent {
  id: string;
  organization_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  active: boolean;
  public_stats_token: string;
  created_at: string;
  updated_at: string;
}

export interface AgentStats {
  agent_name: string;
  total_clicks: number;
  active_days: number;
  unique_links_used: number;
  last_click_at: string | null;
  first_click_at: string | null;
}

export const agentService = {
  /**
   * Get all agents for the current organization
   */
  async getAgents(): Promise<Agent[]> {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .order("name");

    if (error) throw error;
    return data as Agent[];
  },

  /**
   * Get a single agent by ID
   */
  async getAgent(id: string): Promise<Agent> {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Agent;
  },

  /**
   * Create a new agent
   */
  async createAgent(agent: Omit<Agent, "id" | "created_at" | "updated_at" | "organization_id" | "public_stats_token">): Promise<Agent> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.app_metadata?.organization_id) {
      throw new Error("User organization not found");
    }

    const { data, error } = await supabase
      .from("agents")
      .insert({
        ...agent,
        organization_id: user.app_metadata.organization_id
      })
      .select()
      .single();

    if (error) throw error;
    return data as Agent;
  },

  /**
   * Update an agent
   */
  async updateAgent(id: string, updates: Partial<Omit<Agent, "id" | "created_at" | "updated_at" | "organization_id" | "public_stats_token">>): Promise<Agent> {
    const { data, error } = await supabase
      .from("agents")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Agent;
  },

  /**
   * Delete an agent
   */
  async deleteAgent(id: string): Promise<void> {
    const { error } = await supabase
      .from("agents")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Get public agent statistics using token (no auth required)
   */
  async getPublicStats(token: string): Promise<AgentStats | null> {
    const { data, error } = await supabase
      .rpc("get_agent_public_stats", { token });

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  /**
   * Get agent's QR code signed URL
   */
  async getAgentQRUrl(agentId: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from("qr")
      .createSignedUrl(`agents/${agentId}.png`, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  }
};
