
import { supabase } from "@/integrations/supabase/client";
import { qrService } from "./qrService";
import type { Database } from "@/integrations/supabase/types";

type TrackedLink = Database["public"]["Tables"]["tracked_links"]["Row"];
type TrackedLinkInsert = Database["public"]["Tables"]["tracked_links"]["Insert"];
type TrackedLinkUpdate = Database["public"]["Tables"]["tracked_links"]["Update"];

export interface TrackedLinkWithQR extends TrackedLink {
  qr_url?: string;
}

export const trackedLinkService = {
  /**
   * Get all tracked links for an organization
   */
  async getTrackedLinks(organizationId: string, activationId?: string): Promise<TrackedLinkWithQR[]> {
    let query = supabase
      .from("tracked_links")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (activationId) {
      query = query.eq("activation_id", activationId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  /**
   * Get a single tracked link by ID
   */
  async getTrackedLink(id: string): Promise<TrackedLinkWithQR | null> {
    const { data, error } = await supabase
      .from("tracked_links")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    if (data) {
      try {
        const qrUrl = await qrService.getQRSignedUrl(
          data.id,
          data.activation_id,
          data.zone_id,
          data.agent_id
        );
        return { ...data, qr_url: qrUrl };
      } catch {
        return data;
      }
    }

    return data;
  },

  /**
   * Check if slug is available
   */
  async checkSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    const { data, error } = await supabase.rpc("check_slug_available", {
      p_slug: slug,
      p_exclude_id: excludeId || null
    });

    if (error) throw error;
    return data as boolean;
  },

  /**
   * Generate slug suggestion from name
   */
  generateSlugSuggestion(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 50);
  },

  /**
   * Create a new tracked link with QR code
   */
  async createTrackedLink(
    link: Omit<TrackedLinkInsert, "id" | "created_at" | "updated_at">
  ): Promise<TrackedLinkWithQR> {
    const { data, error } = await supabase
      .from("tracked_links")
      .insert(link)
      .select()
      .single();

    if (error) throw error;

    try {
      const qrUrl = await qrService.generateAndUploadQR({
        trackedLinkId: data.id,
        slug: data.slug,
        activationId: data.activation_id,
        zoneId: data.zone_id,
        agentId: data.agent_id
      });

      return { ...data, qr_url: qrUrl };
    } catch (qrError) {
      console.error("QR generation failed:", qrError);
      return data;
    }
  },

  /**
   * Update a tracked link
   */
  async updateTrackedLink(
    id: string,
    updates: TrackedLinkUpdate
  ): Promise<TrackedLinkWithQR> {
    const { data, error } = await supabase
      .from("tracked_links")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (updates.slug) {
      try {
        const qrUrl = await qrService.generateAndUploadQR({
          trackedLinkId: data.id,
          slug: data.slug,
          activationId: data.activation_id,
          zoneId: data.zone_id,
          agentId: data.agent_id
        });

        return { ...data, qr_url: qrUrl };
      } catch (qrError) {
        console.error("QR regeneration failed:", qrError);
        return data;
      }
    }

    return data;
  },

  /**
   * Delete a tracked link
   */
  async deleteTrackedLink(id: string): Promise<void> {
    const link = await this.getTrackedLink(id);
    
    if (link) {
      try {
        await qrService.deleteQR(
          link.id,
          link.activation_id,
          link.zone_id,
          link.agent_id
        );
      } catch (error) {
        console.error("QR deletion failed:", error);
      }
    }

    const { error } = await supabase
      .from("tracked_links")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Get tracked links by zone
   */
  async getTrackedLinksByZone(zoneId: string): Promise<TrackedLink[]> {
    const { data, error } = await supabase
      .from("tracked_links")
      .select("*")
      .eq("zone_id", zoneId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get tracked links by agent
   */
  async getTrackedLinksByAgent(agentId: string): Promise<TrackedLink[]> {
    const { data, error } = await supabase
      .from("tracked_links")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }
};
