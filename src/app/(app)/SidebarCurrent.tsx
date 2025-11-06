"use client";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";

export default function SidebarCurrent() {
  const pathname = usePathname() || "/";
  return <Sidebar current={pathname} />;
}
