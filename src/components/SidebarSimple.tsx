
    "use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/app/overview", label: "Overview" },
  { href: "/app/activations", label: "Activations" },
  { href: "/app/districts", label: "Districts" },
  { href: "/app/zones", label: "Zones" },
  { href: "/app/agents", label: "Agents" },
  { href: "/app/links", label: "Links" },
  { href: "/app/settings", label: "Settings" },
] as const;

export interface SidebarSimpleProps {
  current?: string;
}

export function SidebarSimple({ current }: SidebarSimpleProps) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      const v = localStorage.getItem("sidebar_open");
      if (v !== null) setOpen(v === "1");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("sidebar_open", open ? "1" : "0");
    } catch {
      // ignore
    }
  }, [open]);

  return (
    <aside
      className={`border-r border-gray-100 bg-white transition-all duration-200 ${open ? "w-60" : "w-16"} overflow-hidden`}
    >
      <div className="flex items-center justify-between px-3 py-3">
        <Link href="/app/overview" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white font-bold">D</span>
          {open && <span className="font-semibold">Dashboard</span>}
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="btn-press rounded border px-2 py-1 text-xs"
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          {open ? "«" : "»"}
        </button>
      </div>
      <nav className="mt-2">
        {NAV.map((n) => {
          const active = !!current && n.href.startsWith(current);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`block truncate px-3 py-2 text-sm ${active ? "bg-gray-900 text-white" : "hover:bg-gray-50"}`}
              title={n.label}
              aria-current={active ? "page" : undefined}
            >
              {open ? n.label : n.label[0]}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
  