import Link from "next/link";

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-xl border bg-white p-3 text-sm">{children}</div>
);

export default function Landing() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Top Nav */}
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-semibold">
            DasHttp Track
          </Link>
          <nav className="space-x-3">
            <Link href="/login" className="text-sm hover:underline">
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-block bg-black text-white px-3 py-1.5 rounded text-sm hover:bg-gray-800 transition-colors"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#EEF2FF] via-white to-white" />

        <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-black via-gray-800 to-gray-600 bg-clip-text text-transparent">
            Track activations with QR/NFC.<br className="hidden sm:block" /> Attribute
            results by zone & agent.
          </h1>

          <p className="mt-5 text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Create activations, assign zones & agents, generate unique links/QR codes,
            and see live performance in one dashboard.
          </p>

          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/signup"
              className="bg-gradient-to-r from-black via-gray-900 to-gray-700 text-white px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              Start free
            </Link>
            <Link
              href="/login"
              className="px-6 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Log in
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            <Bullet>• Activations (single/multi-zone)</Bullet>
            <Bullet>• Unique QR per agent + public stats</Bullet>
            <Bullet>• Smart redirects (iOS/Android/fallback)</Bullet>
            <Bullet>• Live analytics & CSV exports</Bullet>
          </div>

          {/* Accent circles */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-indigo-100 to-transparent blur-3xl opacity-40" />
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-xl font-semibold text-center sm:text-left">
          Why teams use DasHttp Track
        </h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="font-medium">Multi-Zone Activations</h3>
            <p className="mt-1 text-sm text-gray-600">
              Organize campaigns by zones with supervisors and on-ground agents.
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="font-medium">Agent Attribution</h3>
            <p className="mt-1 text-sm text-gray-600">
              Auto-generated links & QR codes per agent with transparent stats.
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="font-medium">NFC & Smart Posters</h3>
            <p className="mt-1 text-sm text-gray-600">
              Compare tap-through rates by sticker tagline or zone stand.
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="font-medium">Smart Redirects</h3>
            <p className="mt-1 text-sm text-gray-600">
              Send users to the right store or landing page automatically.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-xl font-semibold text-center sm:text-left">
          How it works
        </h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5">
            <div className="text-xs font-medium text-gray-500">Step 1</div>
            <div className="mt-1 font-medium">Create Activation & Zones</div>
            <p className="mt-1 text-sm text-gray-600">
              Set dates, landing page, and assign supervisors.
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="text-xs font-medium text-gray-500">Step 2</div>
            <div className="mt-1 font-medium">Add Agents & Generate Links</div>
            <p className="mt-1 text-sm text-gray-600">
              Each agent gets a unique link + QR image automatically.
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="text-xs font-medium text-gray-500">Step 3</div>
            <div className="mt-1 font-medium">Track & Optimize</div>
            <p className="mt-1 text-sm text-gray-600">
              Monitor clicks by zone or agent and export CSV reports.
            </p>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Card */}
      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="font-medium">Clean, Real-Time Dashboard</div>
              <p className="text-sm text-gray-600">
                View valid clicks over time, top zones & agents instantly.
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
        <div className="rounded-2xl border bg-black text-white p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-medium">Ready to measure real-world impact?</div>
            <p className="text-sm text-white/80">Start your first activation today.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/signup"
              className="bg-white text-black px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg border border-white/30 hover:bg-white/10 transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t py-6">
        <div className="mx-auto max-w-6xl px-6 text-sm text-gray-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} DasHttp</span>
          <div className="space-x-4">
            <Link className="underline hover:text-gray-700 transition-colors" href="/terms">
              Terms
            </Link>
            <Link className="underline hover:text-gray-700 transition-colors" href="/privacy">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}