
import PageHeader from "@/components/dashboard/PageHeader";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader icon="settings" title="Settings" subtitle="Organization and account preferences" />
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
        Settings will be available here under the unified dashboard shell.
      </div>
    </div>
  );
}
  