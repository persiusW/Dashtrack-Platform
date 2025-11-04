import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/router";

export default function LoginPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const router = useRouter();
  const { next } = router.query;
  const redirectTo = (next as string) || "/app/overview";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    
    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setError(error.message || "Login failed");
      return;
    }

    try {
      await fetch("/api/auth/callback", { method: "POST" });
    } catch {
      // ignore; hard redirect will still work
    }

    window.location.assign(redirectTo);
  }

  // Safety net: if a session already exists, jump to dashboard
  useEffect(() => {
    let cancelled = false;

    // check once at mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled && session) window.location.assign(redirectTo);
    });

    // subscribe to auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) window.location.assign(redirectTo);
    });

    // deadman timer: if something stalls, try a fetch-based confirm
    const t = setTimeout(async () => {
      const r = await fetch("/api/diag/auth").then(r => r.json()).catch(() => null);
      if (r?.session_present) window.location.assign(redirectTo);
    }, 5000);

    return () => {
      cancelled = true;
      clearTimeout(t);
      sub.subscription.unsubscribe();
    };
  }, [supabase, redirectTo]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white border rounded-2xl p-6 space-y-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold">Log in</h1>
          <p className="text-sm text-gray-600 mt-1">Welcome back to DasHttp Track</p>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
            {error}
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

        <div className="text-sm text-center text-gray-600">
          No account?{" "}
          <Link href="/signup" className="underline font-medium text-black">
            Sign up
          </Link>
        </div>
      </form>
    </div>
  );
}
