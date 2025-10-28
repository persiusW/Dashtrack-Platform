
import { supabase } from "@/integrations/supabase/client";

export interface TrackedLink {
  id: string;
  organization_id: string;
  activation_id: string;
  zone_id: string | null;
  agent_id: string | null;
  slug: string;
  destination_strategy: "single" | "smart";
  single_url: string | null;
  ios_url: string | null;
  android_url: string | null;
  fallback_url: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const trackedLinkService = {
  /**
   * Get all tracked links for the current organization
   */
  async getTrackedLinks(filters?: { activation_id?: string; zone_id?: string; agent_id?: string }): Promise<TrackedLink[]> {
    let query = supabase.from("tracked_links").select("*");

    if (filters?.activation_id) {
      query = query.eq("activation_id", filters.activation_id);
    }
    if (filters?.zone_id) {
      query = query.eq("zone_id", filters.zone_id);
    }
    if (filters?.agent_id) {
      query = query.eq("agent_id", filters.agent_id);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    return data as TrackedLink[];
  },

  /**
   * Get a single tracked link by ID
   */
  async getTrackedLink(id: string): Promise<TrackedLink> {
    const { data, error } = await supabase
      .from("tracked_links")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as TrackedLink;
  },

  /**
   * Get a tracked link by slug (for redirect logic)
   */
  async getTrackedLinkBySlug(slug: string): Promise<TrackedLink | null> {
    const { data, error } = await supabase
      .from("tracked_links")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data as TrackedLink | null;
  },

  /**
   * Create a new tracked link
   */
  async createTrackedLink(link: Omit<TrackedLink, "id" | "created_at" | "updated_at" | "organization_id">): Promise<TrackedLink> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.app_metadata?.organization_id) {
      throw new Error("User organization not found");
    }

    const { data, error } = await supabase
      .from("tracked_links")
      .insert({
        ...link,
        organization_id: user.app_metadata.organization_id
      })
      .select()
      .single();

    if (error) throw error;
    return data as TrackedLink;
  },

  /**
   * Update a tracked link
   */
  async updateTrackedLink(id: string, updates: Partial<Omit<TrackedLink, "id" | "created_at" | "updated_at" | "organization_id">>): Promise<TrackedLink> {
    const { data, error } = await supabase
      .from("tracked_links")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as TrackedLink;
  },

  /**
   * Delete a tracked link
   */
  async deleteTrackedLink(id: string): Promise<void> {
    const { error } = await supabase
      .from("tracked_links")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Generate a unique slug for a new link
   */
  async generateSlug(baseName: string): Promise<string> {
    const baseSlug = baseName.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.getTrackedLinkBySlug(slug);
      if (!existing) return slug;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
};
