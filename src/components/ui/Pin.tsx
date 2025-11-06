"use client";
import React from "react";

export interface PinProps {
  className?: string;
}

export default function Pin({ className = "" }: PinProps) {
  return (
    <div
      className={`relative flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white shadow ${className}`}
      style={{ animation: "float 4s ease-in-out infinite" }}
    >
      <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
      <span
        className="absolute inset-0 rounded-full"
        style={{ animation: "pulse-ring 2.4s ease-out infinite" }}
      />
    </div>
  );
}
  