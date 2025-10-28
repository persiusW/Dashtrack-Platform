
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Layers, 
  MapPin, 
  Users, 
  Link2, 
  FileText, 
  CreditCard, 
  Settings 
} from "lucide-react";

const navItems = [
  { href: "/app/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/app/activations", label: "Activations", icon: Layers },
  { href: "/app/zones", label: "Zones", icon: MapPin },
  { href: "/app/agents", label: "Agents", icon: Users },
  { href: "/app/links", label: "Links", icon: Link2 },
  { href: "/app/reports", label: "Reports", icon: FileText },
  { href: "/app/billing", label: "Billing", icon: CreditCard },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="w-60 bg-white border-r border-gray-200 h-screen fixed left-0 top-14 overflow-y-auto">
      <div className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
