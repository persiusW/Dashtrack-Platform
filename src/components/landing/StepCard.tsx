import React from "react";

export interface StepCardProps {
  step: string;
  title: string;
  children: React.ReactNode;
}

export function StepCard({ step, title, children }: StepCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
        Step {step}
      </div>
      <h3 className="mt-3 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-gray-600">{children}</p>
    </div>
  );
}
  