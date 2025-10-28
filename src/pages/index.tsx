import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">DashTrack</h1>
          <div className="flex gap-3">
            <Link href="/app/overview">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/app/overview">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-5xl font-bold mb-6">
            Track Your Activations with Precision
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Multi-tenant SaaS platform for tracking activation campaigns, zones, agents, and smart link redirects with comprehensive analytics.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/app/overview">
              <Button size="lg">Start Free Trial</Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg">Learn More</Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <h3 className="text-3xl font-bold text-center mb-12">
              Everything You Need to Track Success
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-4xl mb-4">📊</div>
                <h4 className="text-xl font-semibold mb-2">Real-Time Analytics</h4>
                <p className="text-gray-600">
                  Track clicks, conversions, and performance metrics in real-time across all your activations.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-4xl mb-4">🎯</div>
                <h4 className="text-xl font-semibold mb-2">Smart Link Management</h4>
                <p className="text-gray-600">
                  Create device-aware links with iOS, Android, and fallback URLs for optimal user experience.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-4xl mb-4">👥</div>
                <h4 className="text-xl font-semibold mb-2">Agent Performance</h4>
                <p className="text-gray-600">
                  Monitor individual agent performance with public stats pages and QR code generation.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-4xl mb-4">🗺️</div>
                <h4 className="text-xl font-semibold mb-2">Zone Management</h4>
                <p className="text-gray-600">
                  Organize campaigns by geographic zones with location-based tracking and reporting.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-4xl mb-4">📈</div>
                <h4 className="text-xl font-semibold mb-2">Detailed Reports</h4>
                <p className="text-gray-600">
                  Export comprehensive CSV reports by zone, agent, or activation for deep analysis.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-4xl mb-4">🔒</div>
                <h4 className="text-xl font-semibold mb-2">Multi-Tenant Security</h4>
                <p className="text-gray-600">
                  Enterprise-grade security with role-based access control and organization isolation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-3xl font-bold mb-6">Ready to Get Started?</h3>
            <p className="text-xl text-gray-600 mb-8">
              Join teams already tracking their success with DashTrack
            </p>
            <Link href="/app/overview">
              <Button size="lg">Create Your Account</Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 mb-4 md:mb-0">
              © {new Date().getFullYear()} DashTrack. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/terms" className="text-gray-600 hover:text-gray-900">
                Terms
              </Link>
              <Link href="/privacy" className="text-gray-600 hover:text-gray-900">
                Privacy
              </Link>
              <Link href="/app/overview" className="text-gray-600 hover:text-gray-900">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
