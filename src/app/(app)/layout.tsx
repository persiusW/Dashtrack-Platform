import type { ReactNode } from "react";
import Topbar from "@/components/dashboard/Topbar";
import SidebarCurrent from "./SidebarCurrent";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <aside className="shrink-0">
          <SidebarCurrent />
        </aside>
        <main className="flex-1">
          <div className="border-b bg-white">
            <div className="px-4 py-3 md:px-6">
              <Topbar />
            </div>
          </div>
          <div className="px-4 py-6 md:px-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
