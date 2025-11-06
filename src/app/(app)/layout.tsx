
import type { ReactNode } from "react";
import SidebarCurrent from "./SidebarCurrent";
import Topbar from "@/components/dashboard/Topbar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SidebarCurrent />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
  