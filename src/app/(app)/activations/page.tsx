import PageHeader from "@/components/dashboard/PageHeader";
import { CreateActivationDialog } from "@/components/forms/CreateActivationDialog";

export default function ActivationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon="layers"
        title="Activations"
        subtitle="Manage your campaigns"
        actions={<CreateActivationDialog />}
      />
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
        Your activations will appear here. Use the Create activation button to add a new one.
      </div>
    </div>
  );
}
