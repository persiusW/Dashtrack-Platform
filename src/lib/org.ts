
import { createRouteHandlerClient, createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function getServerUserAndOrg() {
  const supa = createServerComponentClient({ cookies });
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return { user: null, orgId: null, supa };

  const { data: profile } = await supa
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();

  return { user, orgId: (profile as any)?.organization_id ?? null, supa };
}

export async function getRouteUserAndOrg() {
  const supa = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return { user: null, orgId: null, supa };

  const { data: profile } = await supa
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();

  return { user, orgId: (profile as any)?.organization_id ?? null, supa };
}

// Guard helpers: return boolean
export async function activationInOrg(supa: any, activationId: string, orgId: string) {
  const { data } = await supa
    .from("activations")
    .select("id")
    .eq("id", activationId)
    .eq("organization_id", orgId)
    .maybeSingle();
  return !!data;
}

export async function zoneInOrg(supa: any, zoneId: string, orgId: string) {
  const { data } = await supa
    .from("zones")
    .select("id")
    .eq("id", zoneId)
    .eq("organization_id", orgId)
    .maybeSingle();
  return !!data;
}

export async function districtInOrg(supa: any, districtId: string, orgId: string) {
  const { data } = await supa
    .from("districts")
    .select("id")
    .eq("id", districtId)
    .eq("organization_id", orgId)
    .maybeSingle();
  return !!data;
}

export async function agentInOrg(supa: any, agentId: string, orgId: string) {
  const { data } = await supa
    .from("agents")
    .select("id")
    .eq("id", agentId)
    .eq("organization_id", orgId)
    .maybeSingle();
  return !!data;
}
  