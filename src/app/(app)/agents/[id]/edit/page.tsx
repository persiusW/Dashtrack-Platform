
import PageHeader from "@/components/dashboard/PageHeader";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export default async function AgentManagePage({ params }: { params: { id: string } }) {
  const supa = createServerComponentClient({ cookies });
  const {
    data: { user },
  } = await supa.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <PageHeader icon="users" title="Manage Agent" />
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Please sign in to manage this agent.
        </div>
      </div>
    );
  }

  const { data: agent } = await supa
    .from("agents")
    .select("id, name")
    .eq("id", params.id)
    .maybeSingle();

  if (!agent) {
    return (
      <div className="space-y-6">
        <PageHeader icon="users" title="Manage Agent" />
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

  return (
    <div className="space-y-6">
      <PageHeader icon="users" title={`Manage: ${agent.name}`} subtitle="Agent management" />

      <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
        Management UI is coming soon. In the meantime, you can:
        <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-gray-700">
          <li>View stats on the agent page</li>
          <li>Reassign links from the Activations or Zones contexts</li>
          <li>Contact support for bulk updates</li>
        </ul>
      </div>

      <div className="flex gap-2">
        <Link href={`/app/agents/${agent.id}`} className="btn-press rounded border px-3 py-1.5 text-sm hover:bg-gray-50">
          View stats
        </Link>
        <Link href="/app/agents" className="btn-press rounded border px-3 py-1.5 text-sm hover:bg-gray-50">
          Back to Agents
        </Link>
      </div>
    </div>
  );
}
  