import { useEffect, useState } from "react";
import Link from "next/link";

export default function TestConnectionPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/test-supabase")
      .then((res) => res.json())
      .then((data) => {
        setResult(data);
        setLoading(false);
      })
      .catch((err) => {
        setResult({
          success: false,
          error: "Failed to test connection",
          details: err.message,
        });
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-2xl bg-white border rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-4">🔧 Supabase Connection Test</h1>

        {loading ? (
          <div className="text-gray-600">Testing connection...</div>
        ) : (
          <div className="space-y-4">
            {result.success ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="font-medium text-green-800">✅ Success</div>
                <div className="text-sm text-green-700 mt-2">{result.message}</div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="font-medium text-red-800">❌ Connection Failed</div>
                <div className="text-sm text-red-700 mt-2">
                  <strong>Error:</strong> {result.error}
                </div>
                {result.details && (
                  <div className="text-sm text-red-700 mt-1">
                    <strong>Details:</strong> {result.details}
                  </div>
                )}
                {result.hint && (
                  <div className="text-sm text-red-700 mt-2 font-medium">
                    💡 {result.hint}
                  </div>
                )}
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium mb-2">Connection Details:</div>
              <pre className="text-xs bg-white border rounded p-3 overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>

            <div className="flex gap-3">
              <Link
                href="/login"
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
              >
                Try Login
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Test Again
              </button>
            </div>

            <div className="text-xs text-gray-500 mt-4">
              <p className="font-medium mb-1">Common Issues:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Supabase project is paused (check your Supabase dashboard)</li>
                <li>Network connectivity issues in the sandbox environment</li>
                <li>API keys are invalid or expired</li>
                <li>CORS configuration issues</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
