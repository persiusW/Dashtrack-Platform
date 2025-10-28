
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            DashTrack
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        
        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Data Collected</h2>
            <p className="text-gray-600 mb-4">
              We collect information you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
              <li>Account information (email, name, organization details)</li>
              <li>Campaign and link configuration data</li>
              <li>Usage data and analytics</li>
            </ul>
            <p className="text-gray-600 mb-4">
              When someone clicks a tracked link, we automatically collect:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>IP address (for geo-location and fraud detection)</li>
              <li>User agent (browser and device information)</li>
              <li>Referrer URL</li>
              <li>Timestamp of the click</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Usage</h2>
            <p className="text-gray-600 mb-4">
              We use the collected data to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Generate analytics and reports for your campaigns</li>
              <li>Detect and prevent fraudulent clicks and abuse</li>
              <li>Communicate with you about your account and service updates</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Data Retention</h2>
            <p className="text-gray-600 mb-4">
              Click data is retained for 30 days by default, after which detailed logs are deleted. 
              Aggregated metrics may be retained longer for historical reporting purposes.
            </p>
            <p className="text-gray-600">
              Account data is retained for the duration of your account plus a reasonable period 
              after closure for backup and legal purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
            <p className="text-gray-600 mb-4">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Encrypted connections (HTTPS/TLS)</li>
              <li>Row-level security policies on database access</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication requirements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Your Rights</h2>
            <p className="text-gray-600 mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Access and export your data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt out of marketing communications</li>
              <li>Withdraw consent for data processing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Contact</h2>
            <p className="text-gray-600">
              For privacy-related questions or to exercise your rights, contact us at 
              privacy@dashtrack.example.com
            </p>
          </section>

          <div className="pt-8 text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <Link href="/" className="hover:text-gray-900">
            Back to Home
          </Link>
        </div>
      </footer>
    </div>
  );
}
