"use client";
import CountUp from "@/components/ui/CountUp";

export interface KpiCardProps {
  label: string;
  value: number | string;
  delta?: string;
  spark?: number[];
}

export default function KpiCard({ label, value, delta, spark }: KpiCardProps) {
  return (
    <div className="reveal rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="mt-1 text-2xl font-bold">
        {typeof value === "number" ? <CountUp to={value} /> : value}
      </div>
      {delta ? <div className="text-xs text-emerald-600">{delta}</div> : null}
      {spark && spark.length > 1 ? <Sparkline data={spark} /> : null}
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const W = 160;
  const H = 40;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - ((v - min) / (max - min || 1)) * H;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 h-10 w-full text-gray-900/70">
      <polyline fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="8" points={points} />
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={points} />
    </svg>
  );
}