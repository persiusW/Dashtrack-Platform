import { supabase } from "@/integrations/supabase/client";
import { qrService } from "./qrService";
import type { Database } from "@/integrations/supabase/types";
import { customAlphabet } from "nanoid";

export type TrackedLink = Database["public"]["Tables"]["tracked_links"]["Row"];
type TrackedLinkInsert = Database["public"]["Tables"]["tracked_links"]["Insert"];
type TrackedLinkUpdate = Database["public"]["Tables"]["tracked_links"]["Update"];

export interface TrackedLinkWithQR extends TrackedLink {
  qr_url?: string;
}

// Lowercase a-z0-9 generator for short unique suffixes
const nanoidLower = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);

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
        const qrUrl = await qrService.getQRSignedUrl({
          trackedLinkId: data.id,
          activationId: data.activation_id,
          zoneId: data.zone_id,
          agentId: data.agent_id
        });
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
    let query = supabase
      .from("tracked_links")
      .select("id")
      .eq("slug", slug);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return !data || data.length === 0;
  },

  /**
   * Generate slug suggestion from name (adds a short suffix when base is empty/too short)
   */
  generateSlugSuggestion(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 40);

    if (!base || base.length < 3) {
      return `link-${nanoidLower()}`;
    }
    return base;
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
        await qrService.deleteQR({
          trackedLinkId: link.id,
          activationId: link.activation_id,
          zoneId: link.zone_id,
          agentId: link.agent_id
        });
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
   * Get tracked links by activation
   */
  async getLinksByActivation(activationId: string): Promise<TrackedLink[]> {
    const { data, error } = await supabase
      .from("tracked_links")
      .select("*")
      .eq("activation_id", activationId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
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
  },

  /**
   * Get tracked link by slug (for redirect endpoint)
   */
  async getTrackedLinkBySlug(slug: string): Promise<TrackedLink | null> {
    const { data, error } = await supabase
      .from("tracked_links")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error) {
      if ((error as any)?.code === "PGRST116") return null;
      throw error;
    }

    return data;
  }
};
