"use client";
import React, { useState } from "react";
import { Grid2X2, UserRound, Nfc, Share2 } from "lucide-react";

type TabKey = "multi" | "agent" | "nfc" | "redirects";

const tabs: { key: TabKey; label: string; icon: React.ReactNode; title: string; desc: string }[] = [
  {
    key: "multi",
    label: "Multi-zone",
    icon: <Grid2X2 className="h-4 w-4" />,
    title: "Multi-zone activations",
    desc: "Create campaigns by districts, add zones and supervisors, then onboard agents."
  },
  {
    key: "agent",
    label: "Agent attribution",
    icon: <UserRound className="h-4 w-4" />,
    title: "Agent attribution",
    desc: "Auto-generate unique links per agent with a public stats page."
  },
  {
    key: "nfc",
    label: "NFC & posters",
    icon: <Nfc className="h-4 w-4" />,
    title: "NFC & smart posters",
    desc: "Tap-to-open landing pages and compare performance by sticker tagline."
  },
  {
    key: "redirects",
    label: "Smart redirects",
    icon: <Share2 className="h-4 w-4" />,
    title: "Smart redirects",
    desc: "Send users to the right app store or landing page automatically."
  },
];

export function FeatureTabs() {
  const [active, setActive] = useState<TabKey>("multi");
  const current = tabs.find(t => t.key === active)!;

  return (
    <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${t.key === active ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 hover:bg-gray-50"}`}
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-gray-700">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6">
        <div className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-700">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Feature
        </div>
        <h3 className="mt-3 text-lg font-semibold">{current.title}</h3>
        <p className="mt-1 text-sm text-gray-600">{current.desc}</p>
        <div className="mt-6 h-40 rounded-xl bg-[radial-gradient(circle_at_30%_30%,#F3F4F6,transparent_60%),radial-gradient(circle_at_70%_60%,#EEF2FF,transparent_55%)]" />
      </div>
    </div>
  );
}
  