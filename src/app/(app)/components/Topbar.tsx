
"use client";

import Link from "next/link";

interface TopbarProps {
  userEmail?: string;
}

export function Topbar({ userEmail }: TopbarProps) {
  return (
    <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      <Link href="/app/overview" className="text-xl font-bold text-gray-900">
        DashTrack
      </Link>

      {/* Middle section - empty, FilterBar will go below */}
      <div className="flex-1" />

      {/* Right section - user info */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">{userEmail || "Loading..."}</span>
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-gray-600">
            {userEmail?.charAt(0).toUpperCase() || "?"}
          </span>
        </div>
      </div>
    </header>
  );
}
