
import PageHeader from "@/components/dashboard/PageHeader";
import CopyButton from "@/components/ui/CopyButton";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export default async function AgentDetailPage({ params }: { params: { id: string } }) {
  const supa = createServerComponentClient({ cookies });
  const {
    data: { user },
  } = await supa.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <PageHeader icon="users" title="Agent" subtitle="View agent details and performance" />
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Please sign in to view this agent.
        </div>
      </div>
    );
  }

  const { data: agent } = await supa
    .from("agents")
    .select("id, name, public_stats_token")
    .eq("id", params.id)
    .maybeSingle();

  if (!agent) {
    return (
      <div className="space-y-6">
        <PageHeader icon="users" title="Agent" />
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Agent not found.
        </div>
        <div>
          <Link href="/app/agents" className="btn-press rounded border px-3 py-1.5 text-sm hover:bg-gray-50">
            Back to Agents
          </Link>
        </div>
      </div>
    );
  }

  const { data: link } = await supa
    .from("tracked_links")
    .select("slug")
    .eq("agent_id", agent.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  const short = link?.slug ? `/l/${link.slug}` : "";
  const absolute = link?.slug ? (baseUrl ? `${baseUrl}${short}` : short) : "";

  return (
    <div className="space-y-6">
      <PageHeader icon="users" title={agent.name || "Agent"} subtitle="View agent details and performance" />

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="text-sm text-gray-600">Agent ID</div>
        <div className="font-mono text-sm">{agent.id}</div>

        <div className="mt-4 text-sm text-gray-600">Public Stats</div>
        {agent.public_stats_token ? (
          <div className="flex items-center gap-2">
            <Link
              href={`/a/${agent.public_stats_token}`}
              target="_blank"
              className="underline underline-offset-2 text-sm"
            >
              Open public page
            </Link>
          </div>
        ) : (
          <div className="text-sm text-gray-500">No public stats token</div>
        )}

        <div className="mt-4 text-sm text-gray-600">Latest active link</div>
        {link?.slug ? (
          <div className="flex items-center gap-2">
            <Link href={short} target="_blank" className="underline underline-offset-2 text-sm">
              {short}
            </Link>
            <CopyButton text={absolute} />
            <Link
              href={`/app/agents/${agent.id}/edit`}
              className="btn-press rounded border px-3 py-1.5 text-xs hover:bg-gray-50 ml-auto"
            >
              Manage
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">No link</div>
            <Link
              href={`/app/agents/${agent.id}/edit`}
              className="btn-press rounded border px-3 py-1.5 text-xs hover:bg-gray-50"
            >
              Manage
            </Link>
          </div>
        )}
      </div>

      <div>
        <Link href="/app/agents" className="btn-press rounded border px-3 py-1.5 text-sm hover:bg-gray-50">
          Back to Agents
        </Link>
      </div>
    </div>
  );
}
  