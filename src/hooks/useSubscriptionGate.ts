
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionGate {
  allowed: boolean;
  plan: string;
  loading: boolean;
}

export function useSubscriptionGate(feature?: string): SubscriptionGate {
  const { profile } = useAuth();
  const [plan, setPlan] = useState<string>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrganizationPlan = async () => {
      if (!profile?.organization_id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("organizations")
          .select("plan")
          .eq("id", profile.organization_id)
          .single();

        if (error) throw error;
        setPlan(data.plan || "free");
      } catch (error) {
        console.error("Error fetching organization plan:", error);
        setPlan("free");
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationPlan();
  }, [profile?.organization_id]);

  const adminBypassOrgIds = process.env.NEXT_PUBLIC_ADMIN_BYPASS_ORG_IDS?.split(",") || [];
  const isAdminBypass = profile?.role === "admin" || adminBypassOrgIds.includes(profile?.organization_id || "");

  const allowed = isAdminBypass || plan !== "free";

  return { allowed, plan, loading };
}
