import Link from "next/link";
import { MapPin } from "lucide-react";
import { HeroChip, FeatureCard, StepCard, KPI, Reveal } from "@/components/landing/LandingSections";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-white text-gray-900">
      {/* Background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 gradient-move bg-[radial-gradient(60%_50%_at_70%_10%,#EEF2FF_0%,transparent_60%)]" />
        <div className="absolute -top-40 -left-40 h-[540px] w-[540px] rounded-full bg-[conic-gradient(from_210deg,#E9D5FF_0%,#DBEAFE_30%,transparent_70%)] blur-3xl opacity-40" />
      </div>

      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-black font-bold text-white">D</span>
            <span className="font-semibold">DashTrack</span>
          </Link>
          <nav className="hidden gap-8 text-sm md:flex">
            <a href="#features" className="hover:text-black">
              Features
            </a>
            <a href="#how" className="hover:text-black">
              How it works
            </a>
            <a href="#pricing" className="hover:text-black">
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-press rounded-lg px-3 py-2 text-sm hover:bg-gray-50">
              Log in
            </Link>
            <Link href="/signup" className="btn-press rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 pb-16 pt-12 md:grid-cols-2 md:pt-20">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 pulse-ring" /> Live attribution for QR/NFC links
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              Track activations by{" "}
              <span className="bg-gradient-to-r from-black to-gray-500 bg-clip-text text-transparent">district</span>,{" "}
              <span className="bg-gradient-to-r from-black to-gray-500 bg-clip-text text-transparent">zone</span> &amp;{" "}
              <span className="bg-gradient-to-r from-black to-gray-500 bg-clip-text text-transparent">agent</span>.
            </h1>
            <p className="mt-4 max-w-xl text-gray-600">
              Create campaigns, assign districts &amp; zones, add agents and auto-generate unique links/QRs. See real-time
              performance and pay marketers fairly.
            </p>

            {/* Hero CTAs */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/signup" className="btn-press rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-900">
                Start free
              </Link>
              <Link href="/login" className="btn-press rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-medium hover:bg-gray-50">
                Log in
              </Link>
              <Link href="/app/overview" className="btn-press text-sm text-gray-600 underline underline-offset-4 hover:text-black">
                View dashboard
              </Link>
            </div>

            {/* Hero chips */}
            <div className="mt-6 grid max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
              <HeroChip>Multi-zone activations</HeroChip>
              <HeroChip>Unique QR per agent</HeroChip>
              <HeroChip>Smart redirects (iOS/Android)</HeroChip>
              <HeroChip>Live analytics &amp; CSV exports</HeroChip>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="h-72 w-full bg-[radial-gradient(circle_at_30%_30%,#F3F4F6,transparent_60%),radial-gradient(circle_at_70%_60%,#EEF2FF,transparent_55%)]" />
              <MapPin aria-hidden className="absolute left-6 top-8 anim-float" style={{ animationDelay: "0s" }} />
              <MapPin aria-hidden className="absolute right-8 top-10 anim-float" style={{ animationDelay: "0.2s" }} />
              <MapPin aria-hidden className="absolute left-1/3 top-1/2 anim-float" style={{ animationDelay: "0.4s" }} />
              <MapPin aria-hidden className="absolute right-10 bottom-12 anim-float" style={{ animationDelay: "0.6s" }} />
              <MapPin aria-hidden className="absolute left-10 bottom-8 anim-float" style={{ animationDelay: "0.8s" }} />
            </div>
            <div className="absolute -bottom-6 left-6 w-64 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">This week</p>
              <p className="mt-1 text-2xl font-bold">2,105 valid clicks</p>
              <p className="text-xs text-emerald-600">+8% vs last week</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" className="border-t border-gray-100 bg-white py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold">Why teams use DashTrack</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-gray-600">
            Districts → Zones → Agents. Generate trackable links &amp; QR/NFC tags for each layer and attribute results accurately.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Reveal style={{ animationDelay: "0ms" }}>
              <FeatureCard
                title="Multi-zone activations"
                desc="Create campaigns by districts, add zones and supervisors, then onboard agents."
                icon="grid"
              />
            </Reveal>
            <Reveal style={{ animationDelay: "75ms" }}>
              <FeatureCard
                title="Agent attribution"
                desc="Auto-generate unique links per agent with a public stats page."
                icon="user"
              />
            </Reveal>
            <Reveal style={{ animationDelay: "150ms" }}>
              <FeatureCard
                title="NFC & smart posters"
                desc="Tap-to-open landing pages and compare performance by sticker tagline."
                icon="nfc"
              />
            </Reveal>
            <Reveal style={{ animationDelay: "225ms" }}>
              <FeatureCard
                title="Smart redirects"
                desc="Send users to the right app store or landing page automatically."
                icon="redirect"
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-[linear-gradient(180deg,#FAFAFA,white)] py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-bold">How it works</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Reveal style={{ animationDelay: "0ms" }}>
              <StepCard step="1" title="Create activation">
                Name your campaign, add districts &amp; zones, assign supervisors.
              </StepCard>
            </Reveal>
            <Reveal style={{ animationDelay: "75ms" }}>
              <StepCard step="2" title="Add agents &amp; generate links">
                Agents get unique links/QR codes automatically—no logins needed.
              </StepCard>
            </Reveal>
            <Reveal style={{ animationDelay: "150ms" }}>
              <StepCard step="3" title="Track &amp; optimize">
                See valid clicks over time, top zones/agents and export CSVs.
              </StepCard>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Card */}
      <section className="mx-auto max-w-6xl px-6 pb-12">
        <Reveal>
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="font-medium">Clean, Real-Time Dashboard</div>
                <p className="text-sm text-gray-600">
                  View valid clicks over time, top zones &amp; agents instantly.
                </p>
              </div>
              <Link
                href="/app/overview"
                className="btn-press rounded-lg border px-4 py-2 text-sm transition-colors hover:bg-gray-50"
              >
                View Live Demo
              </Link>
            </div>

            <div className="mt-4 flex h-56 items-center justify-center rounded-xl border bg-gradient-to-br from-gray-50 to-gray-100 text-sm text-gray-400">
              (Dashboard Preview Placeholder)
            </div>
          </div>
        </Reveal>
      </section>

      {/* CTA Band */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <Reveal>
          <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border bg-gradient-to-r from-black via-gray-900 to-gray-800 p-8 text-white shadow-lg sm:flex-row">
            <div>
              <div className="text-lg font-medium">Ready to measure real-world impact?</div>
              <p className="text-sm text-white/80">Start your first activation in minutes.</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/signup"
                className="btn-press rounded-lg bg-white px-5 py-2 font-medium text-black transition-opacity hover:opacity-90"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="btn-press rounded-lg border border-white/30 px-5 py-2 font-medium transition-colors hover:bg-white/10"
              >
                Log in
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* KPI STRIP + TESTIMONIAL */}
      <section className="border-t border-gray-100 bg-white py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-3">
            <Reveal style={{ animationDelay: "0ms" }}>
              <KPI value="12k+" label="Agent links generated" />
            </Reveal>
            <Reveal style={{ animationDelay: "75ms" }}>
              <KPI value="98.7%" label="Bot-filter accuracy" />
            </Reveal>
            <Reveal style={{ animationDelay: "150ms" }}>
              <KPI value="&gt;60%" label="Faster payout attribution" />
            </Reveal>
          </div>

          <Reveal style={{ animationDelay: "200ms" }}>
            <div className="mt-10 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white">
              <p className="text-lg">
                “We finally see which zones and agents drive real installs. Weekly reporting is now automatic.”
              </p>
              <p className="mt-2 text-sm text-gray-300">— Campaign Manager, Consumer App</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section id="pricing" className="bg-[linear-gradient(180deg,white,#FAFAFA)] py-14">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-2xl font-bold">Simple monthly pricing</h2>
          <p className="mt-2 text-gray-600">Everything you need to run and measure activations.</p>

          <Reveal style={{ animationDelay: "0ms" }}>
            <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
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
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-sm text-gray-500">
          <span>© 2025 DashTrack</span>
          <div className="space-x-4">
            <Link className="underline transition-colors hover:text-black" href="/terms">
              Terms
            </Link>
            <Link className="underline transition-colors hover:text-black" href="/privacy">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
