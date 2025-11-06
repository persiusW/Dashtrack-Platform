
import PageHeader from "@/components/dashboard/PageHeader";

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader icon="users" title="Agents" subtitle="Manage field agents and their unique links" />
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
        Agents management is moving here. This page uses the restored dashboard shell.
      </div>
    </div>
  );
}
  