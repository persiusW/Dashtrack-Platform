import { supabase } from "@/integrations/supabase/client";

export interface Click {
  id: number; // Changed from string to number
  organization_id: string;
  activation_id: string;
  zone_id: string | null;
  agent_id: string | null;
  tracked_link_id: string;
  ip: string | null;
  user_agent: string | null;
  referrer: string | null;
  device_type: string | null;
  is_bot: boolean;
  created_at: string;
}

export interface ClickAnalytics {
  total_clicks: number;
  unique_visitors: number;
  valid_clicks: number;
  bot_clicks: number;
  device_breakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
    other: number;
  };
  top_referrers: Array<{ referrer: string; count: number }>;
}

export const clickService = {
  /**
   * Get clicks for a specific tracked link
   */
  async getClicksForLink(linkId: string, limit: number = 100): Promise<Click[]> {
    const { data, error } = await supabase
      .from("clicks")
      .select("*")
      .eq("tracked_link_id", linkId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as Click[];
  },

  /**
   * Get clicks for an activation
   */
  async getClicksForActivation(activationId: string, limit: number = 100): Promise<Click[]> {
    const { data, error } = await supabase
      .from("clicks")
      .select("*")
      .eq("activation_id", activationId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as Click[];
  },

  /**
   * Get clicks for a zone
   */
  async getClicksForZone(zoneId: string, limit: number = 100): Promise<Click[]> {
    const { data, error } = await supabase
      .from("clicks")
      .select("*")
      .eq("zone_id", zoneId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as Click[];
  },

  /**
   * Get clicks for an agent
   */
  async getClicksForAgent(agentId: string, limit: number = 100): Promise<Click[]> {
    const { data, error } = await supabase
      .from("clicks")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as Click[];
  },

  /**
   * Get analytics for a tracked link
   */
  async getAnalyticsForLink(linkId: string): Promise<ClickAnalytics> {
    const clicks = await this.getClicksForLink(linkId, 1000);

    const uniqueIps = new Set(clicks.map(c => c.ip).filter(Boolean));
    const validClicks = clicks.filter(c => !c.is_bot);
    const botClicks = clicks.filter(c => c.is_bot);

    const deviceBreakdown = {
      mobile: clicks.filter(c => c.device_type === "mobile").length,
      desktop: clicks.filter(c => c.device_type === "desktop").length,
      tablet: clicks.filter(c => c.device_type === "tablet").length,
      other: clicks.filter(c => !["mobile", "desktop", "tablet"].includes(c.device_type || "")).length
    };

    const referrerCounts = clicks.reduce((acc: Record<string, number>, click) => {
      const ref = click.referrer || "Direct";
      acc[ref] = (acc[ref] || 0) + 1;
      return acc;
    }, {});

    const topReferrers = Object.entries(referrerCounts)
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total_clicks: clicks.length,
      unique_visitors: uniqueIps.size,
      valid_clicks: validClicks.length,
      bot_clicks: botClicks.length,
      device_breakdown: deviceBreakdown,
      top_referrers: topReferrers
    };
  },

  /**
   * Get daily metrics for a tracked link
   */
  async getDailyMetrics(linkId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from("daily_metrics")
      .select("*")
      .eq("tracked_link_id", linkId)
      .gte("date", startDate.toISOString().split("T")[0])
      .order("date", { ascending: true });

    if (error) throw error;
    return data;
  }
};
