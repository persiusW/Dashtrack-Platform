
import { supabase } from "@/integrations/supabase/client";

export interface ZoneReportRow {
  date: string;
  zone_name: string;
  clicks: number;
  valid_clicks: number;
  unique_links: number;
}

export interface AgentReportRow {
  date: string;
  agent_name: string;
  zone_name: string;
  clicks: number;
  valid_clicks: number;
  unique_links: number;
}

export const reportService = {
  /**
   * Get zone report data for an activation
   */
  async getZoneReport(activationId: string, fromDate: string, toDate: string): Promise<ZoneReportRow[]> {
    const { data, error } = await supabase
      .from("activation_zone_report")
      .select("*")
      .eq("activation_id", activationId)
      .gte("date", fromDate)
      .lte("date", toDate)
      .order("date", { ascending: true })
      .order("zone_name", { ascending: true });

    if (error) throw error;
    return data as ZoneReportRow[];
  },

  /**
   * Get agent report data for an activation
   */
  async getAgentReport(activationId: string, fromDate: string, toDate: string): Promise<AgentReportRow[]> {
    const { data, error } = await supabase
      .from("activation_agent_report")
      .select("*")
      .eq("activation_id", activationId)
      .gte("date", fromDate)
      .lte("date", toDate)
      .order("date", { ascending: true })
      .order("agent_name", { ascending: true });

    if (error) throw error;
    return data as AgentReportRow[];
  },

  /**
   * Generate CSV content from zone report data
   */
  generateZoneReportCSV(data: ZoneReportRow[]): string {
    const headers = ["Date", "Zone", "Clicks", "Valid Clicks", "Unique Links"];
    const rows = data.map(row => [
      row.date,
      row.zone_name,
      row.clicks.toString(),
      row.valid_clicks.toString(),
      row.unique_links.toString()
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");
  },

  /**
   * Generate CSV content from agent report data
   */
  generateAgentReportCSV(data: AgentReportRow[]): string {
    const headers = ["Date", "Agent", "Zone", "Clicks", "Valid Clicks", "Unique Links"];
    const rows = data.map(row => [
      row.date,
      row.agent_name,
      row.zone_name,
      row.clicks.toString(),
      row.valid_clicks.toString(),
      row.unique_links.toString()
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");
  },

  /**
   * Download CSV file
   */
  downloadCSV(filename: string, content: string): void {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
