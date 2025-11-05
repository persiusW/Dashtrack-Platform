import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import { Users, Wifi, Link2 } from "lucide-react";

export interface HeroChipProps {
  children: ReactNode;
}

export function HeroChip({ children }: HeroChipProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700">
      {children}
    </div>
  );
}

export type FeatureIconName = "grid" | "user" | "nfc" | "redirect";

function FeatureIcon({ icon }: { icon: FeatureIconName }) {
  const base = "w-5 h-5";
  if (icon === "user") return <Users className={base} />;
  if (icon === "nfc") return <Wifi className={base} />;
  if (icon === "redirect") return <Link2 className={base} />;
  return (
    <svg
      className={base}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </svg>
  );
}

export interface FeatureCardProps {
  title: string;
  desc: string;
  icon: FeatureIconName;
}

export function FeatureCard({ title, desc, icon }: FeatureCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-center gap-3">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <FeatureIcon icon={icon} />
        </div>
        <h3 className="font-medium">{title}</h3>
      </div>
      <p className="text-sm text-gray-600">{desc}</p>
    </div>
  );
}

export interface StepCardProps {
  step: string;
  title: string;
  children: ReactNode;
}

export function StepCard({ step, title, children }: StepCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-center gap-3">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-xs font-medium text-white">
          {step}
        </span>
        <div className="font-medium">{title}</div>
      </div>
      <div className="text-sm text-gray-600">{children}</div>
    </div>
  );
}

export interface KPIProps {
  value: string;
  label: string;
}

export function KPI({ value, label }: KPIProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm">
      <div className="text-3xl font-extrabold">{value}</div>
      <div className="mt-1 text-sm text-gray-600">{label}</div>
    </div>
  );
}

export interface RevealProps extends HTMLAttributes<HTMLDivElement> {
  once?: boolean;
  threshold?: number;
  children: ReactNode;
}

export function Reveal({
  once = true,
  threshold = 0.12,
  children,
  className,
  style,
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          if (once) observer.unobserve(el);
        } else if (!once) {
          el.classList.remove("revealed");
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [once, threshold]);

  const classes = ["reveal", className].filter(Boolean).join(" ");
  return (
    <div ref={ref} className={classes} style={style} {...rest}>
      {children}
    </div>
  );
}
