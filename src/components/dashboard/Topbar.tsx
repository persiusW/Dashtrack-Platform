"use client";
import { useState } from "react";

export function Topbar() {
  const [query, setQuery] = useState("");

  return (
    <div className="sticky top-0 z-30 border-b border-gray-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <ActivationSelect />
          <DateSelect />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Quick search"
            className="w-48 rounded-lg border px-3 py-2 text-sm focus:outline-none"
            aria-label="Quick search"
          />
        </div>
      </div>
    </div>
  );
}

function ActivationSelect() {
  return (
    <select className="rounded-lg border px-3 py-2 text-sm" aria-label="Activation">
      <option>All activations</option>
    </select>
  );
}

function DateSelect() {
  return (
    <select className="rounded-lg border px-3 py-2 text-sm" aria-label="Date range">
      <option>Last 7 days</option>
      <option>Last 30 days</option>
      <option>This month</option>
      <option>Custom…</option>
    </select>
  );
}
