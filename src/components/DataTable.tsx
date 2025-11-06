"use client";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

export interface DataTableColumn {
  key: string;
  label: string;
  className?: string;
}

export type DataTableRow = Record<string, ReactNode>;

export interface DataTableProps {
  columns: DataTableColumn[];
  rows: DataTableRow[];
  emptyMessage?: ReactNode;
  className?: string;
}

export function DataTable({
  columns,
  rows,
  emptyMessage = "No records found",
  className,
}: DataTableProps) {
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setVis(true), 30);
    return () => clearTimeout(id);
  }, []);

  const containerClass =
    "overflow-hidden rounded-xl border border-gray-200 bg-white" +
    (className ? ` ${className}` : "");

  return (
    <div className={containerClass}>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className="px-4 py-3 font-medium">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr
                key={i}
                className={`transition-all ${
                  vis ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                }`}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`px-4 py-3 ${c.className || ""}`}>
                    {r[c.key] ?? ""}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
