import { useEffect, useState } from "react";

export default function AuthDiagPage() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/diag/auth")
      .then((r) => r.json())
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((e) => {
        setErr(String(e));
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-2">Auth Diagnostic Tool</h1>
          <p className="text-gray-600 text-sm">
            This page helps diagnose authentication issues by checking environment
            configuration, session status, and database connectivity.
          </p>
        </div>

        {loading && (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Loading diagnostic data...</p>
          </div>
        )}

        {err && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
            <pre className="text-red-600 text-sm overflow-auto">{err}</pre>
          </div>
        )}

        {data && (
          <>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Environment Status</h2>
              <div className="space-y-2">
                {Object.entries(data.env || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="font-mono text-sm text-gray-700">{key}</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        value
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {value ? "SET" : "MISSING"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Authentication Status</h2>
              <div className="space-y-2">
                {data.auth &&
                  Object.entries(data.auth).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="font-mono text-sm text-gray-700">{key}</span>
                      <span className="text-sm text-gray-900">
                        {typeof value === "boolean"
                          ? value
                            ? "✅ Yes"
                            : "❌ No"
                          : value || "null"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Database Status</h2>
              <div className="space-y-2">
                {data.database &&
                  Object.entries(data.database).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="font-mono text-sm text-gray-700">{key}</span>
                      <span className="text-sm text-gray-900">
                        {typeof value === "boolean"
                          ? value
                            ? "✅ Yes"
                            : "❌ No"
                          : typeof value === "object"
                          ? JSON.stringify(value)
                          : value || "null"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Full Response</h2>
              <pre className="bg-white p-4 rounded text-xs overflow-auto max-h-96 border">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">💡 Tips</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>
                  Open DevTools → Application → Cookies to verify session cookies
                </li>
                <li>Check that all environment variables are set correctly</li>
                <li>Ensure you&apos;re logged in before checking auth status</li>
                <li>
                  If database reads fail, check RLS policies in Supabase dashboard
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
