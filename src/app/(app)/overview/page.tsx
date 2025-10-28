
import Link from "next/link";
import { BarChart, Users, Link2, TrendingUp } from "lucide-react";

// TODO: Replace with real data from RPC calls
const kpiCards = [
  { title: "Total Clicks", value: "0", icon: TrendingUp },
  { title: "Valid Clicks", value: "0", icon: TrendingUp },
  { title: "Top Agents", value: "0", icon: Users },
  { title: "Top Zones", value: "0", icon: BarChart },
];

export default function OverviewPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
          <p className="text-gray-600 mt-1">
            A high-level view of your campaign performance.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/app/activations/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            New Activation
          </Link>
          <Link href="/app/links/new" className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
            Create Link
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card) => (
          <div key={card.title} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-600">{card.title}</h3>
              <card.icon className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Valid Clicks Over Time</h3>
          <div className="h-64 bg-gray-50 rounded-md flex items-center justify-center">
            <BarChart className="w-12 h-12 text-gray-300" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Zones</h3>
          <div className="h-64 bg-gray-50 rounded-md flex items-center justify-center">
            <Users className="w-12 h-12 text-gray-300" />
          </div>
        </div>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Agents</h3>
          <div className="h-48 bg-gray-50 rounded-md flex items-center justify-center">
            <p className="text-gray-500">Agent list placeholder</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top NFC Taglines (v2)</h3>
          <div className="h-48 bg-gray-50 rounded-md flex items-center justify-center">
            <p className="text-gray-500">Tagline list placeholder</p>
          </div>
        </div>
      </div>
    </div>
  );
}
