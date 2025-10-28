
import { supabase } from "@/integrations/supabase/client";

export interface Zone {
  id: string;
  organization_id: string;
  activation_id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  zone_stand_link_id: string | null;
  created_at: string;
  updated_at: string;
}

export const zoneService = {
  /**
   * Get all zones for the current organization
   */
  async getZones(activationId?: string): Promise<Zone[]> {
    let query = supabase.from("zones").select("*");

    if (activationId) {
      query = query.eq("activation_id", activationId);
    }

    const { data, error } = await query.order("name");

    if (error) throw error;
    return data as Zone[];
  },

  /**
   * Get a single zone by ID
   */
  async getZone(id: string): Promise<Zone> {
    const { data, error } = await supabase
      .from("zones")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Zone;
  },

  /**
   * Create a new zone
   */
  async createZone(zone: Omit<Zone, "id" | "created_at" | "updated_at" | "organization_id">): Promise<Zone> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.app_metadata?.organization_id) {
      throw new Error("User organization not found");
    }

    const { data, error } = await supabase
      .from("zones")
      .insert({
        ...zone,
        organization_id: user.app_metadata.organization_id
      })
      .select()
      .single();

    if (error) throw error;
    return data as Zone;
  },

  /**
   * Update a zone
   */
  async updateZone(id: string, updates: Partial<Omit<Zone, "id" | "created_at" | "updated_at" | "organization_id">>): Promise<Zone> {
    const { data, error } = await supabase
      .from("zones")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Zone;
  },

  /**
   * Delete a zone
   */
  async deleteZone(id: string): Promise<void> {
    const { error } = await supabase
      .from("zones")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Get agents assigned to a zone
   */
  async getZoneAgents(zoneId: string) {
    const { data, error } = await supabase
      .from("zone_agents")
      .select(`
        *,
        agents (
          id,
          name,
          phone,
          email,
          active
        )
      `)
      .eq("zone_id", zoneId);

    if (error) throw error;
    return data;
  },

  /**
   * Assign an agent to a zone
   */
  async assignAgent(zoneId: string, agentId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.app_metadata?.organization_id) {
      throw new Error("User organization not found");
    }

    const { data, error } = await supabase
      .from("zone_agents")
      .insert({
        zone_id: zoneId,
        agent_id: agentId,
        organization_id: user.app_metadata.organization_id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Remove an agent from a zone
   */
  async removeAgent(zoneId: string, agentId: string) {
    const { error } = await supabase
      .from("zone_agents")
      .delete()
      .eq("zone_id", zoneId)
      .eq("agent_id", agentId);

    if (error) throw error;
  }
};
