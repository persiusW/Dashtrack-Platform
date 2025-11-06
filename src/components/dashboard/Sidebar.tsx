"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const NAV: { href: string; label: string }[] = [
  { href: "/app/overview", label: "Overview" },
  { href: "/app/activations", label: "Activations" },
  { href: "/app/districts", label: "Districts" },
  { href: "/app/zones", label: "Zones" },
  { href: "/app/agents", label: "Agents" },
  { href: "/app/links", label: "Links" },
  { href: "/app/settings", label: "Settings" },
];

export function Sidebar({ current }: { current?: string }) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const v = typeof window !== "undefined" ? localStorage.getItem("sidebar_open") : null;
    if (v !== null) setOpen(v === "1");
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar_open", open ? "1" : "0");
    }
  }, [open]);

  return (
    <aside className={`border-r border-gray-100 bg-white transition-all duration-200 ${open ? "w-60" : "w-16"} overflow-hidden`}>
      <div className="flex items-center justify-between px-3 py-3">
        <Link href="/app/overview" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white font-bold">D</span>
          {open && <span className="font-semibold">Dashboard</span>}
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="btn-press rounded border px-2 py-1 text-xs"
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          aria-pressed={open ? "true" : "false"}
          title={open ? "Collapse sidebar" : "Expand sidebar"}
        >
          {open ? "«" : "»"}
        </button>
      </div>
      <nav className="mt-2" aria-label="Main navigation">
        {NAV.map((n) => {
          const active = current ? current.startsWith(n.href) : false;
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
