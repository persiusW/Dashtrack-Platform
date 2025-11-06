"use client";
import { useEffect, useRef, useState } from "react";

export interface CountUpProps {
  to: number;
  dur?: number;
}

export default function CountUp({ to, dur = 800 }: CountUpProps) {
  const [v, setV] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      const val = Math.round(from + (to - from) * (0.5 - 0.5 * Math.cos(Math.PI * k)));
      ref.current = val;
      setV(val);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [to, dur]);

  return <span>{v.toLocaleString()}</span>;
}
  