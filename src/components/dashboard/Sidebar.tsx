"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/app/overview", label: "Overview", icon: "overview" },
  { href: "/app/activations", label: "Activations", icon: "layers" },
  { href: "/app/districts", label: "Districts", icon: "map" },
  { href: "/app/zones", label: "Zones", icon: "layers" },
  { href: "/app/agents", label: "Agents", icon: "users" },
  { href: "/app/links", label: "Links", icon: "link" },
  { href: "/app/settings", label: "Settings", icon: "settings" },
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
              className={`flex items-center gap-2 px-3 py-2 text-sm ${active ? "bg-gray-900 text-white" : "hover:bg-gray-50"}`}
              title={n.label}
              aria-current={active ? "page" : undefined}
            >
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md ${active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"}`}>
                <Icon name={n.icon} className="h-4 w-4" />
              </span>
              {open && <span className="truncate">{n.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
