
import Link from "next/link";

export default function TermsPage() {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        
        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Use of Service</h2>
            <p className="text-gray-600 mb-4">
              By accessing and using DashTrack, you agree to be bound by these Terms of Service. 
              You must be at least 18 years old to use this service.
            </p>
            <p className="text-gray-600">
              You are responsible for maintaining the confidentiality of your account credentials 
              and for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Data & Privacy</h2>
            <p className="text-gray-600 mb-4">
              We collect and process data as described in our Privacy Policy. By using DashTrack, 
              you consent to such processing and warrant that all data provided by you is accurate.
            </p>
            <p className="text-gray-600">
              Click data, including IP addresses and user agents, may be stored for analytics purposes. 
              We do not sell your personal data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Billing</h2>
            <p className="text-gray-600 mb-4">
              Free plans are available with limited features. Paid plans are billed monthly or annually 
              and auto-renew unless cancelled before the renewal date.
            </p>
            <p className="text-gray-600">
              Refunds are provided at our discretion. You may cancel your subscription at any time 
              through your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use</h2>
            <p className="text-gray-600 mb-4">
              You may not use DashTrack for any illegal purpose or in violation of any laws. 
              Prohibited activities include but are not limited to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Tracking users without proper consent or disclosure</li>
              <li>Creating malicious or deceptive links</li>
              <li>Attempting to reverse engineer or compromise the service</li>
              <li>Excessive API usage or attempts to overwhelm the system</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Contact</h2>
            <p className="text-gray-600">
              For questions about these Terms of Service, please contact us at support@dashtrack.example.com
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
