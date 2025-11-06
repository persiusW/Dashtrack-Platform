import { AppLayout } from "@/components/layouts/AppLayout";
import { DataTable, type DataTableColumn, type DataTableRow } from "@/components/ui/DataTable";

export default function ComponentsDemoPage() {
  const columns: DataTableColumn[] = [
    { key: "name", label: "Link name" },
    { key: "agent", label: "Agent" },
    { key: "zone", label: "Zone" },
    { key: "clicks", label: "Valid clicks", className: "text-right" },
    { key: "last", label: "Last click", className: "text-right" },
  ];

  const rows: DataTableRow[] = [
    { name: "Promo — iOS Store", agent: "Mariam K.", zone: "Zone A", clicks: 152, last: "2m ago" },
    { name: "NFC — Market Gate 3", agent: "Samuel O.", zone: "Zone C", clicks: 144, last: "12m ago" },
    { name: "Poster — Uni Library", agent: "Kwesi A.", zone: "Zone B", clicks: 126, last: "27m ago" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="reveal">
          <h1 className="text-2xl font-bold">Components: DataTable</h1>
          <p className="text-sm text-gray-600">Animated, simple data table for quick lists.</p>
        </header>

        <section className="reveal">
          <DataTable columns={columns} rows={rows} />
        </section>
      </div>
    </AppLayout>
  );
}
