
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Agent = Database["public"]["Tables"]["agents"]["Row"];
type AgentInsert = Database["public"]["Tables"]["agents"]["Insert"];
type AgentUpdate = Database["public"]["Tables"]["agents"]["Update"];

export const agentService = {
  /**
   * Get all agents for an organization
   */
  async getAgents(organizationId: string): Promise<Agent[]> {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single agent by ID
   */
  async getAgent(id: string): Promise<Agent | null> {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get agent by public stats token
   */
  async getAgentByToken(token: string): Promise<Agent | null> {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("public_stats_token", token)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Generate a unique public stats token (UUID)
   */
  generatePublicStatsToken(): string {
    return crypto.randomUUID();
  },

  /**
   * Create a new agent with auto-generated public_stats_token
   */
  async createAgent(
    agent: Omit<AgentInsert, "id" | "created_at" | "updated_at" | "public_stats_token" | "organization_id">
  ): Promise<Agent> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.app_metadata?.organization_id) {
      throw new Error("User organization not found");
    }

    const agentWithTokenAndOrg = {
      ...agent,
      organization_id: user.app_metadata.organization_id,
      public_stats_token: this.generatePublicStatsToken()
    };

    const { data, error } = await supabase
      .from("agents")
      .insert(agentWithTokenAndOrg)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update an agent
   */
  async updateAgent(id: string, updates: AgentUpdate): Promise<Agent> {
    const { data, error } = await supabase
      .from("agents")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
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
   * Get agents assigned to a zone
   */
  async getAgentsByZone(zoneId: string): Promise<Agent[]> {
    const { data, error } = await supabase
      .from("zone_agents")
      .select("agents(*)")
      .eq("zone_id", zoneId);

    if (error) throw error;
    return data?.map((row: any) => row.agents) || [];
  },

  /**
   * Assign agent to zone
   */
  async assignAgentToZone(zoneId: string, agentId: string, organizationId: string): Promise<void> {
    const { error } = await supabase
      .from("zone_agents")
      .insert({
        zone_id: zoneId,
        agent_id: agentId,
        organization_id: organizationId
      });

    if (error) throw error;
  },

  /**
   * Remove agent from zone
   */
  async removeAgentFromZone(zoneId: string, agentId: string): Promise<void> {
    const { error } = await supabase
      .from("zone_agents")
      .delete()
      .eq("zone_id", zoneId)
      .eq("agent_id", agentId);

    if (error) throw error;
  },

  /**
   * Get zones for an agent
   */
  async getZonesForAgent(agentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("zone_agents")
      .select("zones(*)")
      .eq("agent_id", agentId);

    if (error) throw error;
    return data?.map((row: any) => row.zones) || [];
  }
};
