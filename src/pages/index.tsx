import Link from "next/link";
import useReveal from "@/lib/useReveal";
import CountUp from "@/components/ui/CountUp";
import Pin from "@/components/ui/Pin";
import { HeroChip } from "@/components/landing/HeroChip";
import { KPI } from "@/components/landing/KPI";
import { StepCard } from "@/components/landing/StepCard";
import { FeatureTabs } from "@/components/landing/FeatureTabs";
import React, { useEffect } from "react";

const YEAR = 2025;

function RevealMount() {
  useEffect(() => {
    // Dynamically import to avoid SSR concerns if needed, but direct call is fine too
  }, []);
  useReveal();
  return null;
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <RevealMount />

      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_10%,#EEF2FF_0%,transparent_60%)]" />
        <div
          className="absolute inset-x-0 top-[-35%] h-[420px] bg-[linear-gradient(90deg,#E9D5FF,#DBEAFE,#F0FDF4)] gradient-move blur-3xl opacity-40"
        />
      </div>

      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white font-bold">D</span>
            <span className="font-semibold">DashTrack</span>
          </Link>
          <nav className="hidden gap-8 text-sm md:flex">
            <a href="#features" className="hover:text-black">Features</a>
            <a href="#how" className="hover:text-black">How it works</a>
            <a href="#pricing" className="hover:text-black">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-press rounded-lg px-3 py-2 text-sm hover:bg-gray-50">Log in</Link>
            <Link href="/signup" className="btn-press rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900">Get started</Link>
          </div>
        </div>
      </header>

      <section className="relative">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 pb-16 pt-12 md:grid-cols-2 md:pt-20">
          <div className="reveal">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> Live attribution for QR/NFC links
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              Track activations by <span className="bg-gradient-to-r from-black to-gray-500 bg-clip-text text-transparent">district</span>,{" "}
              <span className="bg-gradient-to-r from-black to-gray-500 bg-clip-text text-transparent">zone</span> &{" "}
              <span className="bg-gradient-to-r from-black to-gray-500 bg-clip-text text-transparent">agent</span>.
            </h1>
            <p className="mt-4 max-w-xl text-gray-600">
              Create campaigns, assign districts & zones, add agents and auto-generate unique links/QRs. See real-time
              performance and pay marketers fairly.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/signup" className="btn-press rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-900">
                Start free
              </Link>
              <Link href="/login" className="btn-press rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-medium hover:bg-gray-50">
                Log in
              </Link>
              <Link href="/app/overview" className="text-sm text-gray-600 underline underline-offset-4 hover:text-black">
                View dashboard
              </Link>
            </div>

            <div className="mt-6 grid max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
              <HeroChip>Multi-zone activations</HeroChip>
              <HeroChip>Unique QR per agent</HeroChip>
              <HeroChip>Smart redirects (iOS/Android)</HeroChip>
              <HeroChip>Live analytics & CSV exports</HeroChip>
            </div>
          </div>

          <div className="relative reveal">
            <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="h-72 w-full bg-[radial-gradient(circle_at_30%_30%,#F3F4F6,transparent_60%),radial-gradient(circle_at_70%_60%,#EEF2FF,transparent_55%)]" />
              <Pin className="absolute left-6 top-8" />
              <Pin className="absolute right-8 top-10" />
              <Pin className="absolute left-1/3 top-1/2" />
              <Pin className="absolute right-10 bottom-12" />
              <Pin className="absolute left-10 bottom-8" />
            </div>
            <div className="absolute -bottom-6 left-6 w-64 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">This week</p>
              <p className="mt-1 text-2xl font-bold">
                <CountUp to={2105} /> valid clicks
              </p>
              <p className="text-xs text-emerald-600">+8% vs last week</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-gray-100 bg-white py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="reveal text-center text-2xl font-bold">Why teams use DashTrack</h2>
          <p className="reveal mx-auto mt-2 max-w-2xl text-center text-gray-600">
            Districts → Zones → Agents. Generate trackable links &amp; QR/NFC tags for each layer and attribute results accurately.
          </p>
          <FeatureTabs />
        </div>
      </section>

      <section id="how" className="bg-[linear-gradient(180deg,#FAFAFA,white)] py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="reveal text-2xl font-bold">How it works</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <StepCard step="1" title="Create activation">
              Name your campaign, add districts &amp; zones, assign supervisors.
            </StepCard>
            <StepCard step="2" title="Add agents &amp; generate links">
              Agents get unique links/QR codes automatically—no logins needed.
            </StepCard>
            <StepCard step="3" title="Track &amp; optimize">
              See valid clicks over time, top zones/agents and export CSVs.
            </StepCard>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-100 bg-white py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-3">
            <KPI value={<CountUp to={12000} />} label="Agent links generated" />
            <KPI value="98.7%" label="Bot-filter accuracy" />
            <KPI value="&gt;60%" label="Faster payout attribution" />
          </div>

          <div className="mt-10 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white">
            <p className="text-lg">“We finally see which zones and agents drive real installs. Weekly reporting is now automatic.”</p>
            <p className="mt-2 text-sm text-gray-300">— Campaign Manager, Consumer App</p>
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-[linear-gradient(180deg,white,#FAFAFA)] py-14">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="reveal text-2xl font-bold">Simple monthly pricing</h2>
          <p className="reveal mt-2 text-gray-600">Everything you need to run and measure activations.</p>

          <div className="reveal mx-auto mt-8 max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-end justify-center gap-1">
              <span className="text-4xl font-extrabold">$960</span>
              <span className="pb-1 text-gray-600">/ month</span>
            </div>
            <ul className="mt-4 space-y-2 text-left text-sm text-gray-700">
              <li>• Unlimited activations, districts &amp; zones</li>
              <li>• Unique links/QRs for agents + public stats</li>
              <li>• Real-time dashboard + CSV exports</li>
              <li>• Weekly performance report &amp; support</li>
            </ul>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/signup" className="btn-press rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-900">
                Start free
              </Link>
              <Link href="/login" className="btn-press rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-medium hover:bg-gray-50">
                Log in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-gray-600 md:flex-row">
          <div>© {YEAR} DashTrack</div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-black">Log in</Link>
            <Link href="/signup" className="hover:text-black">Get started</Link>
            <a href="#features" className="hover:text-black">Features</a>
            <a href="#how" className="hover:text-black">How it works</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
