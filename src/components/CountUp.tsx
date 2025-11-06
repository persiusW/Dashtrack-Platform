"use client";
import { useEffect, useRef, useState } from "react";

export interface CountUpProps {
  to: number;
  dur?: number;
  locale?: string;
}

export function CountUp({ to, dur = 800, locale = "en-US" }: CountUpProps) {
  const [v, setV] = useState<number>(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (dur <= 0) {
      setV(Math.round(to));
      return;
    }
    const start = performance.now();
    const from = 0;

    const step = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      const eased = 0.5 - 0.5 * Math.cos(Math.PI * k);
      const val = Math.round(from + (to - from) * eased);
      setV(val);
      if (k < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };

    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [to, dur]);

  return <span>{v.toLocaleString(locale)}</span>;
}
