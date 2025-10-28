import { supabase } from "@/integrations/supabase/client";

export interface KPIData {
  totalClicks: number;
  validClicks: number;
  totalAgents: number;
  activeActivations: number;
}

export interface TimeSeriesData {
  date: string;
  validClicks: number;
}

export interface TopZone {
  id: string;
  name: string;
  validClicks: number;
}

export interface TopAgent {
  id: string;
  name: string;
  validClicks: number;
  publicStatsToken: string;
}

export interface ZonePerformance {
  zoneId: string;
  zoneName: string;
  totalClicks: number;
  validClicks: number;
  uniqueVisitors: number;
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  totalClicks: number;
  validClicks: number;
  publicStatsToken: string;
}

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60000;

function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  cache.delete(key);
  return null;
}

function setCachedData(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

function getMostRecentEntry(
  entries: { date: string | null }[] | null
): string | null {
  if (!entries || entries.length === 0) return null;
  return entries.reduce((latest, entry) => {
    if (!entry.date) return latest;
    if (!latest) return entry.date;
    return new Date(entry.date) > new Date(latest) ? entry.date : latest;
  }, entries[0].date);
}

export const dashboardService = {
  async getOverviewKPIs(dateFrom: string, dateTo: string): Promise<KPIData> {
    const cacheKey = `overview-kpis-${dateFrom}-${dateTo}`;
    const cached = getCachedData<KPIData>(cacheKey);
    if (cached) return cached;

    const { data: clicks } = await supabase
      .from("clicks")
      .select("is_bot")
      .gte("created_at", `${dateFrom}T00:00:00Z`)
      .lte("created_at", `${dateTo}T23:59:59Z`);

    const { data: agents } = await supabase
      .from("agents")
      .select("id")
      .eq("active", true);

    const { data: activations } = await supabase
      .from("activations")
      .select("id")
      .eq("status", "live");

    const totalClicks = clicks?.length || 0;
    const validClicks = clicks?.filter((c) => !c.is_bot).length || 0;

    const result = {
      totalClicks,
      validClicks,
      totalAgents: agents?.length || 0,
      activeActivations: activations?.length || 0,
    };

    setCachedData(cacheKey, result);
    return result;
  },

  async getTimeSeriesData(
    dateFrom: string,
    dateTo: string,
    activationId?: string,
    zoneId?: string
  ): Promise<TimeSeriesData[]> {
    const cacheKey = `timeseries-${dateFrom}-${dateTo}-${activationId || "all"}-${zoneId || "all"}`;
    const cached = getCachedData<TimeSeriesData[]>(cacheKey);
    if (cached) return cached;

    let query = supabase
      .from("clicks")
      .select("created_at, is_bot")
      .gte("created_at", `${dateFrom}T00:00:00Z`)
      .lte("created_at", `${dateTo}T23:59:59Z`);

    if (activationId) {
      query = query.eq("activation_id", activationId);
    }
    if (zoneId) {
      query = query.eq("zone_id", zoneId);
    }

    const { data } = await query;

    const dateMap = new Map<string, number>();
    data?.forEach((click) => {
      if (!click.is_bot && click.created_at) {
        const date = new Date(click.created_at).toISOString().split("T")[0];
        dateMap.set(date, (dateMap.get(date) || 0) + 1);
      }
    });

    const result = Array.from(dateMap.entries())
      .map(([date, validClicks]) => ({ date, validClicks }))
      .sort((a, b) => a.date.localeCompare(b.date));

    setCachedData(cacheKey, result);
    return result;
  },

  async getTopZones(dateFrom: string, dateTo: string, limit: number = 5): Promise<TopZone[]> {
    const cacheKey = `top-zones-${dateFrom}-${dateTo}-${limit}`;
    const cached = getCachedData<TopZone[]>(cacheKey);
    if (cached) return cached;

    const { data } = await supabase
      .from("clicks")
      .select("zone_id, is_bot, zones!inner(id, name)")
      .gte("created_at", `${dateFrom}T00:00:00Z`)
      .lte("created_at", `${dateTo}T23:59:59Z`)
      .not("zone_id", "is", null);

    const zoneMap = new Map<string, { name: string; validClicks: number }>();
    data?.forEach((click: any) => {
      if (!click.is_bot && click.zones) {
        const existing = zoneMap.get(click.zone_id) || { name: click.zones.name, validClicks: 0 };
        existing.validClicks++;
        zoneMap.set(click.zone_id, existing);
      }
    });

    const result = Array.from(zoneMap.entries())
      .map(([id, data]) => ({ id, name: data.name, validClicks: data.validClicks }))
      .sort((a, b) => b.validClicks - a.validClicks)
      .slice(0, limit);

    setCachedData(cacheKey, result);
    return result;
  },

  async getTopAgents(dateFrom: string, dateTo: string, limit: number = 5): Promise<TopAgent[]> {
    const cacheKey = `top-agents-${dateFrom}-${dateTo}-${limit}`;
    const cached = getCachedData<TopAgent[]>(cacheKey);
    if (cached) return cached;

    const { data } = await supabase
      .from("clicks")
      .select("agent_id, is_bot, agents!inner(id, name, public_stats_token)")
      .gte("created_at", `${dateFrom}T00:00:00Z`)
      .lte("created_at", `${dateTo}T23:59:59Z`)
      .not("agent_id", "is", null);

    const agentMap = new Map<string, { name: string; validClicks: number; publicStatsToken: string }>();
    data?.forEach((click: any) => {
      if (!click.is_bot && click.agents) {
        const existing = agentMap.get(click.agent_id) || {
          name: click.agents.name,
          validClicks: 0,
          publicStatsToken: click.agents.public_stats_token,
        };
        existing.validClicks++;
        agentMap.set(click.agent_id, existing);
      }
    });

    const result = Array.from(agentMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        validClicks: data.validClicks,
        publicStatsToken: data.publicStatsToken,
      }))
      .sort((a, b) => b.validClicks - a.validClicks)
      .slice(0, limit);

    setCachedData(cacheKey, result);
    return result;
  },

  async getActivationKPIs(activationId: string, dateFrom: string, dateTo: string): Promise<KPIData> {
    const { data: clicks } = await supabase
      .from("clicks")
      .select("is_bot")
      .eq("activation_id", activationId)
      .gte("created_at", `${dateFrom}T00:00:00Z`)
      .lte("created_at", `${dateTo}T23:59:59Z`);

    const { data: zones } = await supabase
      .from("zones")
      .select("id")
      .eq("activation_id", activationId);

    const { data: zoneAgents } = await supabase
      .from("zone_agents")
      .select("agent_id")
      .in("zone_id", zones?.map(z => z.id) || []);

    const uniqueAgents = new Set(zoneAgents?.map(za => za.agent_id) || []);

    return {
      totalClicks: clicks?.length || 0,
      validClicks: clicks?.filter((c) => !c.is_bot).length || 0,
      totalAgents: uniqueAgents.size,
      activeActivations: 1,
    };
  },

  async getZonePerformance(activationId: string, dateFrom: string, dateTo: string): Promise<ZonePerformance[]> {
    const { data } = await supabase
      .from("clicks")
      .select("zone_id, is_bot, ip, zones!inner(id, name)")
      .eq("activation_id", activationId)
      .gte("created_at", `${dateFrom}T00:00:00Z`)
      .lte("created_at", `${dateTo}T23:59:59Z`)
      .not("zone_id", "is", null);

    const zoneMap = new Map<string, { name: string; totalClicks: number; validClicks: number; ips: Set<string> }>();
    data?.forEach((click: any) => {
      if (click.zones) {
        const existing = zoneMap.get(click.zone_id) || {
          name: click.zones.name,
          totalClicks: 0,
          validClicks: 0,
          ips: new Set(),
        };
        existing.totalClicks++;
        if (!click.is_bot) {
          existing.validClicks++;
        }
        if (click.ip) {
          existing.ips.add(click.ip);
        }
        zoneMap.set(click.zone_id, existing);
      }
    });

    return Array.from(zoneMap.entries()).map(([zoneId, data]) => ({
      zoneId,
      zoneName: data.name,
      totalClicks: data.totalClicks,
      validClicks: data.validClicks,
      uniqueVisitors: data.ips.size,
    }));
  },

  async getAgentPerformance(activationId: string, dateFrom: string, dateTo: string): Promise<AgentPerformance[]> {
    const { data } = await supabase
      .from("clicks")
      .select("agent_id, is_bot, agents!inner(id, name, public_stats_token)")
      .eq("activation_id", activationId)
      .gte("created_at", `${dateFrom}T00:00:00Z`)
      .lte("created_at", `${dateTo}T23:59:59Z`)
      .not("agent_id", "is", null);

    const agentMap = new Map<string, { name: string; totalClicks: number; validClicks: number; publicStatsToken: string }>();
    data?.forEach((click: any) => {
      if (click.agents) {
        const existing = agentMap.get(click.agent_id) || {
          name: click.agents.name,
          totalClicks: 0,
          validClicks: 0,
          publicStatsToken: click.agents.public_stats_token,
        };
        existing.totalClicks++;
        if (!click.is_bot) {
          existing.validClicks++;
        }
        agentMap.set(click.agent_id, existing);
      }
    });

    return Array.from(agentMap.entries()).map(([agentId, data]) => ({
      agentId,
      agentName: data.name,
      totalClicks: data.totalClicks,
      validClicks: data.validClicks,
      publicStatsToken: data.publicStatsToken,
    }));
  },

  async getZoneDetailKPIs(zoneId: string, dateFrom: string, dateTo: string): Promise<KPIData & { zoneName: string }> {
    const { data: zone } = await supabase
      .from("zones")
      .select("name")
      .eq("id", zoneId)
      .single();

    const { data: clicks } = await supabase
      .from("clicks")
      .select("is_bot")
      .eq("zone_id", zoneId)
      .gte("created_at", `${dateFrom}T00:00:00Z`)
      .lte("created_at", `${dateTo}T23:59:59Z`);

    const { data: zoneAgents } = await supabase
      .from("zone_agents")
      .select("agent_id")
      .eq("zone_id", zoneId);

    return {
      zoneName: zone?.name || "Unknown Zone",
      totalClicks: clicks?.length || 0,
      validClicks: clicks?.filter((c) => !c.is_bot).length || 0,
      totalAgents: zoneAgents?.length || 0,
      activeActivations: 1,
    };
  },

  async getZoneAgentLeaderboard(zoneId: string, dateFrom: string, dateTo: string): Promise<AgentPerformance[]> {
    const { data: zoneAgents } = await supabase
      .from("zone_agents")
      .select("agent_id")
      .eq("zone_id", zoneId);

    const agentIds = zoneAgents?.map(za => za.agent_id) || [];
    if (agentIds.length === 0) return [];

    const { data } = await supabase
      .from("clicks")
      .select("agent_id, is_bot, agents!inner(id, name, public_stats_token)")
      .eq("zone_id", zoneId)
      .in("agent_id", agentIds)
      .gte("created_at", `${dateFrom}T00:00:00Z`)
      .lte("created_at", `${dateTo}T23:59:59Z`);

    const agentMap = new Map<string, { name: string; totalClicks: number; validClicks: number; publicStatsToken: string }>();
    data?.forEach((click: any) => {
      if (click.agents) {
        const existing = agentMap.get(click.agent_id) || {
          name: click.agents.name,
          totalClicks: 0,
          validClicks: 0,
          publicStatsToken: click.agents.public_stats_token,
        };
        existing.totalClicks++;
        if (!click.is_bot) {
          existing.validClicks++;
        }
        agentMap.set(click.agent_id, existing);
      }
    });

    return Array.from(agentMap.entries())
      .map(([agentId, data]) => ({
        agentId,
        agentName: data.name,
        totalClicks: data.totalClicks,
        validClicks: data.validClicks,
        publicStatsToken: data.publicStatsToken,
      }))
      .sort((a, b) => b.validClicks - a.validClicks);
  },

  async getZoneKPIs(zoneId: string, dateFrom: string, dateTo: string): Promise<KPIData> {
    const { data: clicks } = await supabase
      .from("clicks")
      .select("is_bot")
      .eq("zone_id", zoneId)
      .gte("created_at", `${dateFrom}T00:00:00Z`)
      .lte("created_at", `${dateTo}T23:59:59Z`);

    const { data: zoneAgents } = await supabase
      .from("zone_agents")
      .select("agent_id")
      .eq("zone_id", zoneId);

    return {
      totalClicks: clicks?.length || 0,
      validClicks: clicks?.filter((c) => !c.is_bot).length || 0,
      totalAgents: zoneAgents?.length || 0,
      activeActivations: 1,
    };
  },

  async getZoneStandLinkPerformance(
    zoneId: string,
    dateFrom: string,
    dateTo: string
  ): Promise<{ standClicks: number; agentAverage: number }> {
    const { data: zone } = await supabase
      .from("zones")
      .select("zone_stand_link_id")
      .eq("id", zoneId)
      .single();

    if (!zone?.zone_stand_link_id) {
      return { standClicks: 0, agentAverage: 0 };
    }

    const { data: standClicks } = await supabase
      .from("clicks")
      .select("is_bot")
      .eq("tracked_link_id", zone.zone_stand_link_id)
      .gte("created_at", `${dateFrom}T00:00:00Z`)
      .lte("created_at", `${dateTo}T23:59:59Z`);

    const { data: zoneAgents } = await supabase
      .from("zone_agents")
      .select("agent_id")
      .eq("zone_id", zoneId);

    const agentIds = zoneAgents?.map(za => za.agent_id) || [];
    if (agentIds.length === 0) {
      return {
        standClicks: standClicks?.filter(c => !c.is_bot).length || 0,
        agentAverage: 0,
      };
    }

    const { data: agentClicks } = await supabase
      .from("clicks")
      .select("agent_id, is_bot")
      .eq("zone_id", zoneId)
      .in("agent_id", agentIds)
      .gte("created_at", `${dateFrom}T00:00:00Z`)
      .lte("created_at", `${dateTo}T23:59:59Z`);

    const agentClickMap = new Map<string, number>();
    agentClicks?.forEach(click => {
      if (!click.is_bot) {
        agentClickMap.set(click.agent_id, (agentClickMap.get(click.agent_id) || 0) + 1);
      }
    });

    const totalAgentClicks = Array.from(agentClickMap.values()).reduce((sum, count) => sum + count, 0);
    const agentAverage = agentClickMap.size > 0 ? totalAgentClicks / agentClickMap.size : 0;

    return {
      standClicks: standClicks?.filter(c => !c.is_bot).length || 0,
      agentAverage,
    };
  },
};
