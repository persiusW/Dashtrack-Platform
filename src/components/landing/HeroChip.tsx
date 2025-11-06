import React from "react";

export interface HeroChipProps {
  children: React.ReactNode;
}

export function HeroChip({ children }: HeroChipProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-900" />
      <span>{children}</span>
    </div>
  );
}
  