import type { ReactNode } from "react";
import SidebarCurrent from "./SidebarCurrent";
import Topbar from "@/components/dashboard/Topbar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SidebarCurrent />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="px-4 py-6">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
