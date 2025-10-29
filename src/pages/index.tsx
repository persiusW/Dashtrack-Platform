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
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-white" />
        <div className="relative mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <h1 className="text-4xl sm:text-5xl font-bold text-center">
            Track activations with QR/NFC. Attribute results by zone & agent.
          </h1>
          <p className="mt-4 text-center text-gray-600 max-w-2xl mx-auto">
            Create activations, assign zones & agents, generate unique links/QR codes, and see live performance in one dashboard.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/signup"
              className="bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Start free
            </Link>
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-lg border hover:bg-gray-50 transition-colors"
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

      {/* Footer */}
      <footer className="mt-auto border-t py-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} DasHttp Track
      </footer>
    </main>
  );
}