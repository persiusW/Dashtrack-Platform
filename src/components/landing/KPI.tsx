import React from "react";

export interface KPIProps {
  value: React.ReactNode;
  label: string;
}

export function KPI({ value, label }: KPIProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm">
      <div className="text-3xl font-extrabold">{value}</div>
      <div className="mt-1 text-sm text-gray-600">{label}</div>
    </div>
  );
}
  