import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import { Topbar } from "./components/Topbar";
import { SidebarNav } from "./components/SidebarNav";
import { FilterBar } from "./components/FilterBar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar userEmail={user.email} />
      <SidebarNav />
      <div className="ml-60">
        <FilterBar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
