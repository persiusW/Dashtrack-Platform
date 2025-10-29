import Link from "next/link";

export default function Landing() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="h-14 flex items-center justify-between px-6 border-b">
        <div className="font-semibold">DasHttp Track</div>
        <nav className="space-x-3">
          <Link href="/login" className="text-sm">Log in</Link>
          <Link href="/signup" className="inline-block bg-black text-white px-3 py-1.5 rounded text-sm">Get started</Link>
        </nav>
      </header>

      <section className="px-6 py-16 max-w-4xl mx-auto text-center">
        <h1 className="text-3xl md:text-4xl font-bold">Track activations with QR/NFC links. Attribute results by zone and agent.</h1>
        <p className="mt-4 text-gray-600">
          Create activations, assign zones & agents, generate unique QR/NFC links, and monitor real-time performance on one dashboard.
        </p>
        <div className="mt-6 space-x-3">
          <Link href="/signup" className="bg-black text-white px-4 py-2 rounded">Start free</Link>
          <Link href="/login" className="px-4 py-2 rounded border">View dashboard</Link>
        </div>
        <ul className="mt-10 grid gap-3 text-left md:grid-cols-2 text-sm">
          <li className="border rounded p-3">• Activations (single/multi-zone)</li>
          <li className="border rounded p-3">• Unique QR links per agent</li>
          <li className="border rounded p-3">• Smart redirects (iOS/Android)</li>
          <li className="border rounded p-3">• Live analytics & CSV exports</li>
        </ul>
      </section>

      <footer className="mt-auto border-t py-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} DasHttp • <Link className="underline" href="/terms">Terms</Link> • <Link className="underline" href="/privacy">Privacy</Link>
      </footer>
    </main>
  );
}