import Link from "next/link";
import { MapPin, Share2, Wifi, Link2, FolderPlus, Users, BarChart3 } from "lucide-react";
import type { ReactNode } from "react";

interface HeroChipProps {
  children: ReactNode;
}

function HeroChip({ children }: HeroChipProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700">
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900 flex flex-col">
      {/* Background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_10%,#EEF2FF_0%,transparent_60%)]" />
        <div className="absolute -top-40 -left-40 h-[540px] w-[540px] rounded-full bg-[conic-gradient(from_210deg,#E9D5FF_0%,#DBEAFE_30%,transparent_70%)] blur-3xl opacity-40" />
      </div>

      {/* NAV */}
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
            <Link href="/login" className="rounded-lg px-3 py-2 text-sm hover:bg-gray-50">Log in</Link>
            <Link href="/signup" className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900">Get started</Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 pb-16 pt-12 md:grid-cols-2 md:pt-20">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> Live attribution for QR/NFC links
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              Track activations by <span className="bg-gradient-to-r from-black to-gray-500 bg-clip-text text-transparent">district</span>,{" "}
              <span className="bg-gradient-to-r from-black to-gray-500 bg-clip-text text-transparent">zone</span> &{" "}
              <span className="bg-gradient-to-r from-black to-gray-500 bg-clip-text text-transparent">agent</span>.
            </h1>
            <p className="mt-4 max-w-xl text-gray-600">
              Create campaigns, assign districts &amp; zones, add agents and auto-generate unique links/QRs. See real-time
              performance and pay marketers fairly.
            </p>

            {/* Hero CTAs */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/signup" className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-900">
                Start free
              </Link>
              <Link href="/login" className="rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-medium hover:bg-gray-50">
                Log in
              </Link>
              <Link href="/app/overview" className="text-sm text-gray-600 underline underline-offset-4 hover:text-black">
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
              <MapPin className="absolute left-6 top-8" />
              <MapPin className="absolute right-8 top-10" />
              <MapPin className="absolute left-1/3 top-1/2" />
              <MapPin className="absolute right-10 bottom-12" />
              <MapPin className="absolute left-10 bottom-8" />
            </div>
            <div className="absolute -bottom-6 left-6 w-64 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">This week</p>
              <p className="mt-1 text-2xl font-bold">2,105 valid clicks</p>
              <p className="text-xs text-emerald-600">+8% vs last week</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <hr className="my-12 border-gray-200 mx-auto max-w-6xl" />

      <section id="features" className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-xl font-semibold text-center sm:text-left mb-8">
          Why teams use DashTrack
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border bg-gradient-to-br from-white to-gray-50 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="w-5 h-5 text-indigo-500" />
              <h3 className="font-medium">Multi-Zone Activations</h3>
            </div>
            <p className="text-sm text-gray-600">
              Organize campaigns by zones with supervisors and on-ground agents.
            </p>
          </div>

          <div className="rounded-2xl border bg-gradient-to-br from-white to-gray-50 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <Share2 className="w-5 h-5 text-indigo-500" />
              <h3 className="font-medium">Agent Attribution</h3>
            </div>
            <p className="text-sm text-gray-600">
              Auto-generated links &amp; QR codes per agent with transparent stats.
            </p>
          </div>

          <div className="rounded-2xl border bg-gradient-to-br from-white to-gray-50 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <Wifi className="w-5 h-5 text-indigo-500" />
              <h3 className="font-medium">NFC &amp; Smart Posters</h3>
            </div>
            <p className="text-sm text-gray-600">
              Compare tap-through rates by sticker tagline or zone stand.
            </p>
          </div>

          <div className="rounded-2xl border bg-gradient-to-br from-white to-gray-50 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <Link2 className="w-5 h-5 text-indigo-500" />
              <h3 className="font-medium">Smart Redirects</h3>
            </div>
            <p className="text-sm text-gray-600">
              Send users to the right store or landing page automatically.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <hr className="my-12 border-gray-200 mx-auto max-w-6xl" />

      <section id="how" className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-xl font-semibold text-center sm:text-left mb-8">
          How it works
        </h2>

        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <FolderPlus className="w-5 h-5 text-indigo-500" />
              <div className="font-medium">Create Activations &amp; Zones</div>
            </div>
            <p className="text-sm text-gray-600">
              Set up campaigns, assign supervisors, and configure zone locations.
            </p>
          </div>

          <div className="rounded-2xl border bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-indigo-500" />
              <div className="font-medium">Add Agents &amp; Generate Links</div>
            </div>
            <p className="text-sm text-gray-600">
              Each agent gets a unique link and QR code automatically.
            </p>
          </div>

          <div className="rounded-2xl border bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              <div className="font-medium">Track &amp; Optimize</div>
            </div>
            <p className="text-sm text-gray-600">
              View real-time performance metrics and optimize top-performing zones.
            </p>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Card */}
      <hr className="my-12 border-gray-200 mx-auto max-w-6xl" />

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="font-medium">Clean, Real-Time Dashboard</div>
              <p className="text-sm text-gray-600">
                View valid clicks over time, top zones &amp; agents instantly.
              </p>
            </div>
            <Link
              href="/app/overview"
              className="px-4 py-2 rounded-lg border hover:bg-gray-50 text-sm transition-colors"
            >
              View Live Demo
            </Link>
          </div>

          <div className="mt-4 h-56 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border flex items-center justify-center text-gray-400 text-sm">
            (Dashboard Preview Placeholder)
          </div>
        </div>
      </section>

      {/* CTA Band */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-2xl border bg-gradient-to-r from-black via-gray-900 to-gray-800 text-white p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
          <div>
            <div className="font-medium text-lg">Ready to measure real-world impact?</div>
            <p className="text-sm text-white/80">Start your first activation in minutes.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/signup"
              className="bg-white text-black px-5 py-2 rounded-lg hover:opacity-90 font-medium transition-opacity"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="px-5 py-2 rounded-lg border border-white/30 hover:bg-white/10 font-medium transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-200 py-6 bg-gradient-to-r from-gray-50 to-white">
        <div className="mx-auto max-w-6xl px-6 text-sm text-gray-500 flex items-center justify-between">
          <span>© 2025 DashTrack</span>
          <div className="space-x-4">
            <Link className="underline hover:text-black transition-colors" href="/terms">
              Terms
            </Link>
            <Link className="underline hover:text-black transition-colors" href="/privacy">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
