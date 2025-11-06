"use client";
import React from "react";

export interface PinProps {
  className?: string;
}

export default function Pin({ className = "" }: PinProps) {
  return (
    <div
      className={`relative flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white shadow anim-float ${className}`}
    >
      <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
      <span
        className="absolute inset-0 rounded-full pulse-ring"
      />
    </div>
  );
}
