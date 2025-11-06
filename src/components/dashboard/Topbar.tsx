
    "use client";
import { useEffect, useMemo, useState } from "react";
import ActivationSelect from "@/components/ActivationSelect";
import { useGlobalFilters } from "@/hooks/useGlobalFilters";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Preset = "7d" | "30d" | "month" | "custom";

function formatDateYYYYMMDD(d: Date): string {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
}

function firstDayOfThisMonth(): string {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return formatDateYYYYMMDD(first);
}
function today(): string {
  return formatDateYYYYMMDD(new Date());
}
function daysAgo(n: number): string {
  const now = new Date();
  const d = new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
  return formatDateYYYYMMDD(d);
}

export function Topbar() {
  const { filters, updateFilters } = useGlobalFilters();
  const [query, setQuery] = useState("");

  const derivedPreset: Preset = useMemo(() => {
    const t = today();
    const dFrom = filters.dateFrom;
    const dTo = filters.dateTo;
    if (dTo === t) {
      if (dFrom === daysAgo(7)) return "7d";
      if (dFrom === daysAgo(30)) return "30d";
      if (dFrom === firstDayOfThisMonth()) return "month";
    }
    return "custom";
  }, [filters.dateFrom, filters.dateTo]);

  const [preset, setPreset] = useState<Preset>(derivedPreset);
  const [customFrom, setCustomFrom] = useState<string>(filters.dateFrom);
  const [customTo, setCustomTo] = useState<string>(filters.dateTo);

  useEffect(() => {
    setPreset(derivedPreset);
    setCustomFrom(filters.dateFrom);
    setCustomTo(filters.dateTo);
  }, [derivedPreset, filters.dateFrom, filters.dateTo]);

  const applyPreset = (p: Preset) => {
    setPreset(p);
    if (p === "7d") {
      updateFilters({ dateFrom: daysAgo(7), dateTo: today() });
    } else if (p === "30d") {
      updateFilters({ dateFrom: daysAgo(30), dateTo: today() });
    } else if (p === "month") {
      updateFilters({ dateFrom: firstDayOfThisMonth(), dateTo: today() });
    }
  };

  const applyCustom = () => {
    if (!customFrom || !customTo) return;
    if (new Date(customFrom) > new Date(customTo)) return;
    updateFilters({ dateFrom: customFrom, dateTo: customTo });
  };

  return (
    <div className="border-b border-gray-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <ActivationSelect
            onChange={(id) => updateFilters({ activationId: id, zoneId: undefined })}
          />
          {filters.activationId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateFilters({ activationId: undefined, zoneId: undefined })}
            >
              Clear Activation
            </Button>
          )}
          <select
            value={preset}
            onChange={(e) => {
              const val = e.target.value as Preset;
              if (val === "custom") {
                setPreset("custom");
              } else {
                applyPreset(val);
              }
            }}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="month">This month</option>
            <option value="custom">Custom…</option>
          </select>

          {preset === "custom" && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-9 w-[10.5rem]"
              />
              <span className="text-sm text-gray-500">to</span>
              <Input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-9 w-[10.5rem]"
              />
              <Button size="sm" onClick={applyCustom}>
                Apply
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Quick search"
            className="h-9 w-56"
          />
        </div>
      </div>
    </div>
  );
}
  