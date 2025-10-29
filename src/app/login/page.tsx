"use client";
import { useState } from "react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/app/overview";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Sign in with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Check if it's a network error
        if (signInError.message.includes("Failed to fetch") || 
            signInError.message.includes("Load failed") ||
            signInError.message.includes("Network request failed")) {
          setError(
            "Network connection error. Your Supabase project might be paused or unreachable. " +
            "Visit /test-connection to diagnose."
          );
        } else {
          setError(signInError.message);
        }
        setLoading(false);
        return;
      }

      // Verify session was created
      if (!data.session) {
        setError("Session failed to establish. Please try again.");
        setLoading(false);
        return;
      }

      // CRITICAL: Use window.location.href for full page reload
      // This ensures middleware picks up the new session
      window.location.href = next;
      
    } catch (err: any) {
      console.error("Login error:", err);
      setError(`Unexpected error: ${err.message || "Please try again"}`);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white border rounded-2xl p-6 space-y-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold">Log in</h1>
          <p className="text-sm text-gray-600 mt-1">Welcome back to DasHttp Track</p>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="font-medium mb-1">Login Failed</div>
            <div>{error}</div>
            {error.includes("test-connection") && (
              <Link 
                href="/test-connection"
                className="inline-block mt-2 underline font-medium"
              >
                → Run Connection Test
              </Link>
            )}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white rounded-lg py-2.5 font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Signing in..." : "Continue"}
        </button>

        <div className="pt-2 border-t">
          <div className="text-sm text-center text-gray-600 mb-2">
            Don't have an account?{" "}
            <Link href="/signup" className="underline font-medium text-black">
              Sign up
            </Link>
          </div>
          
          <Link 
            href="/test-connection"
            className="block text-center text-xs text-gray-500 hover:text-black underline"
          >
            Having connection issues? Run diagnostic test
          </Link>
        </div>
      </form>
    </div>
  );
}
