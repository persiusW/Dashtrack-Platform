
"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get default date range (last 7 days)
  const getDefaultDates = () => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 7);
    return {
      from: from.toISOString().split("T")[0],
      to: to.toISOString().split("T")[0],
    };
  };

  const defaults = getDefaultDates();

  const [from, setFrom] = useState(searchParams.get("from") || defaults.from);
  const [to, setTo] = useState(searchParams.get("to") || defaults.to);
  const [activationId, setActivationId] = useState(searchParams.get("activationId") || "");
  const [zoneId, setZoneId] = useState(searchParams.get("zoneId") || "");

  // TODO: Fetch activations and zones from API
  const activations: Array<{ id: string; name: string }> = [];
  const zones: Array<{ id: string; name: string }> = [];

  useEffect(() => {
    // Update query params when filters change
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (activationId) params.set("activationId", activationId);
    if (zoneId) params.set("zoneId", zoneId);

    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(newUrl, { scroll: false });
  }, [from, to, activationId, zoneId, pathname, router]);

  const handleClear = () => {
    const defaults = getDefaultDates();
    setFrom(defaults.from);
    setTo(defaults.to);
    setActivationId("");
    setZoneId("");
  };

  return (
    <div className="sticky top-14 z-10 bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">From:</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">To:</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Activation:</label>
          <select
            value={activationId}
            onChange={(e) => setActivationId(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Activations</option>
            {activations.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Zone:</label>
          <select
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Zones</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleClear}
          className="px-4 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
