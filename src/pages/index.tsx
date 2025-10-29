import Link from "next/link";
import { MapPin, Share2, Wifi, Link2, FolderPlus, Users, BarChart3 } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Top Nav */}
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-semibold">
            DashTrack
          </Link>
          <nav className="space-x-3">
            <Link href="/login" className="text-sm hover:underline">
              Log in
            </Link>
            <Link
              href="/login"
              className="inline-block bg-black text-white px-3 py-1.5 rounded text-sm hover:bg-gray-800"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#EEF2FF] via-white to-white" />
        
        <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-black via-gray-800 to-gray-600 bg-clip-text text-transparent">
            Track activations with QR/NFC.
            <br className="hidden sm:block" /> Attribute results by zone & agent.
          </h1>

          <p className="mt-5 text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Create activations, assign zones & agents, generate unique links/QR codes, and see live performance in one dashboard.
          </p>

          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/login"
              className="bg-gradient-to-r from-black via-gray-900 to-gray-700 text-white px-6 py-2.5 rounded-lg hover:opacity-90"
            >
              Start free
            </Link>
            <Link
              href="/login"
              className="px-6 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              Log in
            </Link>
          </div>

          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-indigo-100 to-transparent blur-3xl opacity-40" />
        </div>
      </section>

      <hr className="my-12 border-gray-200 mx-auto max-w-6xl" />

      {/* Features */}
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
              Auto-generated links & QR codes per agent with transparent stats.
            </p>
          </div>

          <div className="rounded-2xl border bg-gradient-to-br from-white to-gray-50 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <Wifi className="w-5 h-5 text-indigo-500" />
              <h3 className="font-medium">NFC & Smart Posters</h3>
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

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-xl font-semibold text-center sm:text-left mb-8">
          How it works
        </h2>

        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <FolderPlus className="w-5 h-5 text-indigo-500" />
              <div className="font-medium">Create Activations & Zones</div>
            </div>
            <p className="text-sm text-gray-600">
              Set up campaigns, assign supervisors, and configure zone locations.
            </p>
          </div>

          <div className="rounded-2xl border bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-indigo-500" />
              <div className="font-medium">Add Agents & Generate Links</div>
            </div>
            <p className="text-sm text-gray-600">
              Each agent gets a unique link and QR code automatically.
            </p>
          </div>

          <div className="rounded-2xl border bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              <div className="font-medium">Track & Optimize</div>
            </div>
            <p className="text-sm text-gray-600">
              View real-time performance metrics and optimize top-performing zones.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-2xl border bg-gradient-to-r from-black via-gray-900 to-gray-800 text-white p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
          <div>
            <div className="font-medium text-lg">Ready to measure real-world impact?</div>
            <p className="text-sm text-white/80">Start your first activation in minutes.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="bg-white text-black px-5 py-2 rounded-lg hover:opacity-90 font-medium"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="px-5 py-2 rounded-lg border border-white/30 hover:bg-white/10 font-medium"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-200 py-6 bg-gradient-to-r from-gray-50 to-white">
        <div className="mx-auto max-w-6xl px-6 text-sm text-gray-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} DashTrack</span>
          <div className="space-x-4">
            <Link className="underline hover:text-black" href="/terms">
              Terms
            </Link>
            <Link className="underline hover:text-black" href="/privacy">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
