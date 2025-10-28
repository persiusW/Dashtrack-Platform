import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { LoginForm } from "@/components/auth/LoginForm";
import { ThemeSwitch } from "@/components/ThemeSwitch";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/app/overview");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            DashTrack
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Welcome! Sign in to continue.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
