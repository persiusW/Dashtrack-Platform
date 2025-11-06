import type { ReactNode } from "react";
import SidebarCurrent from "./SidebarCurrent";
import Topbar from "@/components/dashboard/Topbar";
import ClientReveal from "./ClientReveal";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarCurrent />
      <div className="flex-1">
        <ClientReveal />
        <Topbar />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </div>
    </div>
  );
}
