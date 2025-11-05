import { createServerComponentClient, createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getServerUserAndOrg(): Promise<{ user: unknown | null; orgId: string | null; supa: SupabaseClient }> {
  const supa = createServerComponentClient({ cookies });
  const {
    data: { user },
  } = await supa.auth.getUser();

  if (!user) {
    return { user: null, orgId: null, supa };
  }

  const { data: profile } = await supa
    .from("profiles")
    .select("organization_id")
    .eq("id", (user as any).id)
    .maybeSingle();

  return { user, orgId: (profile as any)?.organization_id ?? null, supa };
}

export async function getRouteUserAndOrg(): Promise<{ user: unknown | null; orgId: string | null; supa: SupabaseClient }> {
  const supa = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supa.auth.getUser();

  if (!user) {
    return { user: null, orgId: null, supa };
  }

  const { data: profile } = await supa
    .from("profiles")
    .select("organization_id")
    .eq("id", (user as any).id)
    .maybeSingle();

  return { user, orgId: (profile as any)?.organization_id ?? null, supa };
}

export async function zoneInOrg(supa: SupabaseClient, zoneId: string, orgId: string): Promise<boolean> {
  const { data } = await supa
    .from("zones")
    .select("id")
    .eq("id", zoneId)
    .eq("organization_id", orgId)
    .maybeSingle();
  return !!data;
}

export async function agentInOrg(supa: SupabaseClient, agentId: string, orgId: string): Promise<boolean> {
  const { data } = await supa
    .from("agents")
    .select("id")
    .eq("id", agentId)
    .eq("organization_id", orgId)
    .maybeSingle();
  return !!data;
}

export async function activationInOrg(supa: SupabaseClient, activationId: string, orgId: string): Promise<boolean> {
  const { data } = await supa
    .from("activations")
    .select("id")
    .eq("id", activationId)
    .eq("organization_id", orgId)
    .maybeSingle();
  return !!data;
}

export async function districtInOrg(supa: SupabaseClient, districtId: string, orgId: string): Promise<boolean> {
  const { data } = await supa
    .from("districts")
    .select("id")
    .eq("id", districtId)
    .eq("organization_id", orgId)
    .maybeSingle();
  return !!data;
}
