
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { LoginForm } from "@/components/auth/LoginForm";
import { ThemeSwitch } from "@/components/ThemeSwitch";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push("/app/overview");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="absolute top-4 right-4">
        <ThemeSwitch />
      </div>
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="mb-8 text-center">
          <div className="inline-block w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            DashTrack
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Multi-tenant SaaS platform for tracking and analytics
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
